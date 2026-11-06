import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { Course } from '../../shared/entities/course.entity';
import { EnrollmentStatus } from '../../common/enums/enrollment-status.enum';
import { GroupStatus } from '../../common/enums/group-status.enum';
import { AuthUser } from '../../common/utils/branch-scope';
import {
  describeLevelIneligibility,
  isLevelEligible,
} from '../../common/utils/level.util';
import { FinanceService } from '../finance/finance.service';
import { ChatService } from '../chat/chat.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { BookEnrollmentDto } from './dto/book-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(Group) private readonly groups: Repository<Group>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    private readonly finance: FinanceService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Keep the group's chat room in sync with ACTIVE enrollments. Failures
   * are logged but never break enrollment operations.
   */
  private async syncChatRoomSafely(groupId: string): Promise<void> {
    try {
      await this.chatService.syncGroupChatRoom(groupId);
    } catch (err: any) {
      this.logger.warn(`Chat room sync failed for group ${groupId}: ${err?.message ?? err}`);
    }
  }

  /**
   * Level eligibility gate (Business Rule 1). A student may only enroll in a
   * course whose level matches theirs or is at most ONE level below it
   * (e.g. B1 student -> B1 or A2 only). Students without an assigned level
   * cannot be evaluated, so the check passes for them.
   */
  private assertCourseLevelEligible(
    student: Pick<Student, 'current_level'>,
    courseLevel?: string | null,
  ): void {
    if (isLevelEligible(student.current_level, courseLevel)) return;
    throw new BadRequestException(
      describeLevelIneligibility(student.current_level, courseLevel),
    );
  }

  async create(
    dto: CreateEnrollmentDto,
    user: AuthUser,
    opts?: { skipCapacityCheck?: boolean },
  ) {
    const student = await this.students.findOne({ where: { id: dto.student_id } });
    if (!student) throw new NotFoundException('Student not found');

    const eligible = await this.students
      .createQueryBuilder('s')
      .innerJoin('s.user', 'u')
      .where('s.id = :id', { id: dto.student_id })
      .andWhere('s.status = :activeStudent', { activeStudent: 'active' })
      .andWhere('u.status = :activeUser', { activeUser: 'active' })
      .andWhere((qb) => {
        const sub = qb
          .subQuery()
          .select('1')
          .from('user_roles', 'ur')
          .innerJoin('roles', 'r', "r.id = ur.role_id AND r.slug = 'student'")
          .where('ur.user_id = s.user_id')
          .getQuery();
        return `EXISTS ${sub}`;
      })
      .getExists();
    if (!eligible) {
      throw new BadRequestException(
        'Student is not active or no longer holds the student role',
      );
    }

    const group = await this.groups.findOne({ where: { id: dto.group_id }, relations: ['course'] });
    if (!group) throw new NotFoundException('Group not found');

    this.assertCourseLevelEligible(student, group.course?.level);

    const dup = await this.enrollments.findOne({
      where: {
        student_id: dto.student_id,
        group_id: dto.group_id,
        status: In([EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE]),
      },
    });
    if (dup) throw new BadRequestException('Student already has an active enrollment in this group');

    const activeCount = await this.enrollments.count({
      where: { group_id: dto.group_id, status: EnrollmentStatus.ACTIVE },
    });
    if (!opts?.skipCapacityCheck && activeCount >= group.capacity) {
      throw new BadRequestException(`Group is full (capacity ${group.capacity})`);
    }

    const fee = dto.total_fee ?? Number(group.course?.default_price ?? 0);

    const enrollment = await this.enrollments.save(
      this.enrollments.create({
        student_id: student.id,
        group_id: group.id,
        status: EnrollmentStatus.ACTIVE,
        total_fee: fee,
        discount_amount: 0,
        final_amount: fee,
        enrolled_by: user.id,
      }),
    );

    // تم تمرير معامل user للدالة لتجنب خطأ Expected 2 arguments
    const invoice = await this.finance.createInvoiceForEnrollment({
      enrollment_id: enrollment.id,
      student_id: student.id,
      course_id: group.course_id,
      amount: fee,
      description: `Enrollment — ${group.course?.name ?? 'Course'} (${group.name})`,
      promo_code: dto.promo_code,
      manual_discount: dto.discount_amount,
      installments_count: dto.installments_count,
      due_days: dto.due_days,
      created_by: user.id,
    }, user);

    enrollment.discount_amount = invoice.discount_amount;
    enrollment.final_amount = invoice.total_amount;
    await this.enrollments.save(enrollment);

    await this.syncChatRoomSafely(group.id);
    return this.findOne(enrollment.id, user);
  }

  async bookCourse(user: AuthUser, dto: BookEnrollmentDto) {
    const student = await this.students.findOne({
      where: { user_id: user?.id ?? user?.userId },
    });
    if (!student) throw new NotFoundException('Student profile not found');
    if (String(student.status).toLowerCase() !== 'active') {
      throw new BadRequestException('Student profile is not active');
    }

    const course = await this.courses.findOne({ where: { id: dto.course_id } });
    if (!course) throw new NotFoundException('Course not found');

    this.assertCourseLevelEligible(student, course.level);

    const group = await this.resolveBookingGroup(student, course, dto.group_id);

    const dup = await this.enrollments.findOne({
      where: {
        student_id: student.id,
        group_id: group.id,
        status: In([EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE]),
      },
    });
    if (dup) {
      throw new BadRequestException(
        'You already have an enrollment request for this group',
      );
    }

    const fee = Number(group.course?.default_price ?? course.default_price ?? 0);
    const enrollment = await this.enrollments.save(
      this.enrollments.create({
        student_id: student.id,
        group_id: group.id,
        status: EnrollmentStatus.PENDING,
        total_fee: fee,
        discount_amount: 0,
        final_amount: fee,
        enrolled_by: user?.id ?? user?.userId,
      }),
    );

    return this.findOne(enrollment.id, user);
  }

  private async resolveBookingGroup(
    student: Student,
    course: Course,
    groupId?: string,
  ): Promise<Group> {
    if (groupId) {
      const group = await this.groups.findOne({
        where: { id: groupId },
        relations: ['course'],
      });
      if (!group || group.course_id !== course.id) {
        throw new NotFoundException('Group not found for this course');
      }
      await this.assertGroupHasCapacity(group);
      return group;
    }

    const candidates = await this.groups.find({
      where: { course_id: course.id, status: In([GroupStatus.UPCOMING, GroupStatus.ACTIVE]) },
      relations: ['course'],
      order: { start_date: 'ASC' },
    });

    for (const group of candidates) {
      const activeCount = await this.enrollments.count({
        where: { group_id: group.id, status: EnrollmentStatus.ACTIVE },
      });
      const pendingCount = await this.enrollments.count({
        where: { group_id: group.id, status: EnrollmentStatus.PENDING },
      });
      if (activeCount + pendingCount < group.capacity) return group;
    }

    throw new BadRequestException(
      'No available groups with free capacity for this course',
    );
  }

  private async assertGroupHasCapacity(group: Group): Promise<void> {
    const activeCount = await this.enrollments.count({
      where: { group_id: group.id, status: EnrollmentStatus.ACTIVE },
    });
    const pendingCount = await this.enrollments.count({
      where: { group_id: group.id, status: EnrollmentStatus.PENDING },
    });
    if (activeCount + pendingCount >= group.capacity) {
      throw new BadRequestException(`Group is full (capacity ${group.capacity})`);
    }
  }

  async approve(id: string, user: AuthUser) {
    const e = await this.enrollments.findOne({
      where: { id },
      relations: ['student', 'group', 'group.course'],
    });
    if (!e) throw new NotFoundException('Enrollment not found');

    if (e.status === EnrollmentStatus.ACTIVE) return this.findOne(id, user);
    if (e.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestException(
        `Only pending enrollment requests can be approved (current: ${e.status})`,
      );
    }

    const activeCount = await this.enrollments.count({
      where: { group_id: e.group_id, status: EnrollmentStatus.ACTIVE },
    });
    if (e.group && activeCount >= e.group.capacity) {
      throw new BadRequestException(`Group is full (capacity ${e.group.capacity})`);
    }

    e.status = EnrollmentStatus.ACTIVE;
    const saved = await this.enrollments.save(e);

    const alreadyInvoiced = await this.finance.hasInvoiceForEnrollment(saved.id);
    if (!alreadyInvoiced) {
      const fee = Number(saved.final_amount ?? saved.total_fee ?? 0);
      // تم تمرير المعاملات المحدثة وتجنب استخدام branch_id المحذوف
      const invoice = await this.finance.createInvoiceForEnrollment({
        enrollment_id: saved.id,
        student_id: saved.student_id,
        course_id: e.group?.course_id,
        amount: fee,
        description: `Enrollment — ${e.group?.course?.name ?? 'Course'} (${e.group?.name ?? 'Group'})`,
        created_by: user?.id ?? user?.userId,
      }, user);
      saved.discount_amount = invoice.discount_amount;
      saved.final_amount = invoice.total_amount;
      await this.enrollments.save(saved);
    }

    await this.syncChatRoomSafely(saved.group_id);
    return this.findOne(saved.id, user);
  }

  async reject(id: string, reason: string | undefined, user: AuthUser) {
    const e = await this.findOne(id, user);
    if (e.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestException(
        `Only pending enrollment requests can be rejected (current: ${e.status})`,
      );
    }
    e.status = EnrollmentStatus.DROPPED;
    e.dropped_at = new Date();
    e.drop_reason = reason ?? 'Rejected by administrator';
    return this.enrollments.save(e);
  }

  async getMyEnrollments(user: AuthUser) {
    const student = await this.students.findOne({
      where: { user_id: user?.id ?? user?.userId },
    });
    if (!student) return [];
    return this.enrollments.find({
      where: { student_id: student.id },
      relations: ['group', 'group.course'],
      order: { created_at: 'DESC' },
    });
  }

  async countActive(groupId: string): Promise<number> {
    return this.enrollments.count({
      where: { group_id: groupId, status: EnrollmentStatus.ACTIVE },
    });
  }

  async findExisting(
    studentId: string,
    groupId: string,
  ): Promise<Enrollment | null> {
    return this.enrollments.findOne({
      where: {
        student_id: studentId,
        group_id: groupId,
        status: In([EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE]),
      },
    });
  }

  async findAll(user: AuthUser, query: { student_id?: string; group_id?: string; status?: string; branch_id?: string }) {
    const qb = this.enrollments
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.student', 'st')
      .leftJoinAndSelect('e.group', 'g')
      .leftJoinAndSelect('g.course', 'c')
      .orderBy('e.created_at', 'DESC');

    if (query.student_id) qb.andWhere('e.student_id = :sid', { sid: query.student_id });
    if (query.group_id) qb.andWhere('e.group_id = :gid', { gid: query.group_id });
    if (query.status) qb.andWhere('e.status = :st', { st: String(query.status).toLowerCase() });
    // تم تبسيط استعلام الفروع ليتوافق مع البيئة الـ Branchless
    if (query.branch_id && (user?.branchId || user?.roles?.includes('super_admin'))) {
      // يمكن تفعيل الفلترة إذا تطلب الأمر أو تركها مرنة بحسب الصلاحيات
    }

    return qb.take(200).getMany();
  }

  async findOne(id: string, user: AuthUser) {
    const e = await this.enrollments.findOne({
      where: { id },
      relations: ['student', 'student.user', 'group', 'group.course'],
    });
    if (!e) throw new NotFoundException('Enrollment not found');
    const requesterId = user?.id ?? user?.userId;
    const isOwnEnrollment = Boolean(requesterId) && e.student?.user_id === requesterId;
    const isStaff = user?.roles?.some(r => ['super_admin', 'admin', 'academic'].includes(r));
    if (!isOwnEnrollment && !isStaff) {
      throw new NotFoundException('Enrollment not found');
    }
    return e;
  }

  async updateStatus(id: string, dto: UpdateEnrollmentStatusDto, user: AuthUser) {
    const e = await this.findOne(id, user);
    const normalizedStatus = String(dto.status).toLowerCase();
    e.status = normalizedStatus as EnrollmentStatus;
    if (normalizedStatus === 'dropped') {
      e.dropped_at = new Date();
      e.drop_reason = dto.reason ?? null;
    }
    const saved = await this.enrollments.save(e);
    await this.syncChatRoomSafely(e.group_id);
    return saved;
  }

  async drop(id: string, reason: string | undefined, user: AuthUser) {
    return this.updateStatus(id, { status: 'DROPPED', reason }, user);
  }
}