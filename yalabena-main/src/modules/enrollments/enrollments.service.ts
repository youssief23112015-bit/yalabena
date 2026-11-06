import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { Course } from '../../shared/entities/course.entity';
import { EnrollmentStatus } from '../../common/enums/enrollment-status.enum';
import { GroupStatus } from '../../common/enums/group-status.enum';
import { AuthUser, effectiveBranchFilter } from '../../common/utils/branch-scope';
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

    // Server-side eligibility (mirrors the /students + /enrollments picker
    // filters): the profile must be active, the account must be active, and
    // the linked user must STILL hold the student role. Blocks direct API
    // enrollment of users whose role changed away from student even though
    // a stale students row could still exist.
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

    // Business Rule 1: level eligibility is enforced on EVERY enrollment
    // path, including staff-created ones.
    this.assertCourseLevelEligible(student, group.course?.level);

    // NOTE: the enrollment_status PG enum holds LOWERCASE values — the
    // previous uppercase literals ('PENDING'/'ACTIVE') were masked by `as any`
    // casts and crashed at runtime with "invalid input value for enum".
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
    // Admin bypass (force) skips ONLY the capacity gate — eligibility,
    // duplicates, invoicing and chat sync all still run.
    if (!opts?.skipCapacityCheck && activeCount >= group.capacity) {
      throw new BadRequestException(`Group is full (capacity ${group.capacity})`);
    }

    const fee = dto.total_fee ?? Number(group.course?.default_price ?? 0);
    const branchId = student.branch_id ?? group.branch_id;

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

    const invoice = await this.finance.createInvoiceForEnrollment({
      enrollment_id: enrollment.id,
      student_id: student.id,
      course_id: group.course_id,
      branch_id: branchId,
      amount: fee,
      description: `Enrollment â€” ${group.course?.name ?? 'Course'} (${group.name})`,
      promo_code: dto.promo_code,
      manual_discount: dto.discount_amount,
      installments_count: dto.installments_count,
      due_days: dto.due_days,
      created_by: user.id,
    });

    enrollment.discount_amount = invoice.discount_amount;
    enrollment.final_amount = invoice.total_amount;
    await this.enrollments.save(enrollment);

    await this.syncChatRoomSafely(group.id); // auto-join the enrolled student to the group chat room
    return this.findOne(enrollment.id, user);
  }

  /**
   * Student self-service booking ("Book this Course", Business Rule 2).
   * The enrollment is created with PENDING status and forwarded to the
   * Admin / Branch Manager dashboard for review — no invoice is generated
   * until the request is approved. Level eligibility is enforced first
   * (Business Rule 1) and violations surface as 400 Bad Request.
   */
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

    // Business Rule 1 — reject out-of-range levels with a clear 400.
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

  /**
   * Picks the group a student books into. When the DTO pins a group it must
   * belong to the requested course; otherwise the first group of the course
   * with free capacity is selected, preferring the student's own branch.
   */
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

    const inStudentBranch = student.branch_id
      ? candidates.filter((g) => g.branch_id === student.branch_id)
      : [];
    const ordered = [
      ...inStudentBranch,
      ...candidates.filter((g) => !inStudentBranch.includes(g)),
    ];

    for (const group of ordered) {
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

  /**
   * Admin / Branch Manager approval (Business Rule 2). A PENDING request is
   * finalized to ACTIVE: capacity is re-checked, the invoice/payment
   * workflow is triggered (idempotently), and the student joins the group
   * chat room. The course then appears in the LMS dashboard immediately
   * (Business Rule 3 — the LMS queries ACTIVE enrollments only).
   */
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

    // Invoice/payment workflow — only when none exists yet so repeated
    // approvals can never double-bill the student.
    const alreadyInvoiced = await this.finance.hasInvoiceForEnrollment(saved.id);
    if (!alreadyInvoiced) {
      const fee = Number(saved.final_amount ?? saved.total_fee ?? 0);
      const invoice = await this.finance.createInvoiceForEnrollment({
        enrollment_id: saved.id,
        student_id: saved.student_id,
        course_id: e.group?.course_id,
        branch_id: e.student?.branch_id ?? e.group?.branch_id,
        amount: fee,
        description: `Enrollment — ${e.group?.course?.name ?? 'Course'} (${e.group?.name ?? 'Group'})`,
        created_by: user?.id ?? user?.userId,
      });
      saved.discount_amount = invoice.discount_amount;
      saved.final_amount = invoice.total_amount;
      await this.enrollments.save(saved);
    }

    await this.syncChatRoomSafely(saved.group_id);
    return this.findOne(saved.id, user);
  }

  /**
   * Admin rejection of a PENDING request. Stored as DROPPED (the schema has
   * no separate REJECTED status) with the rejection reason preserved.
   */
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

  /** The logged-in student's own enrollments (incl. PENDING requests). */
  async getMyEnrollments(user: AuthUser) {
    const student = await this.students.findOne({
      where: { user_id: user?.id ?? user?.userId },
    });
    if (!student) return [];
    return this.enrollments.find({
      where: { student_id: student.id },
      relations: ['group', 'group.course', 'group.branch'],
      order: { created_at: 'DESC' },
    });
  }

  /** ACTIVE enrollment count of a group (capacity source of truth). */
  async countActive(groupId: string): Promise<number> {
    return this.enrollments.count({
      where: { group_id: groupId, status: EnrollmentStatus.ACTIVE },
    });
  }

  /**
   * The PENDING/ACTIVE enrollment of a student in a group, if any — lets the
   * direct-assign flow decide between create / approve / idempotent no-op.
   */
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
    // The enrollment_status PG enum holds LOWERCASE values — normalise the
    // filter so `?status=PENDING` from the UI matches rows.
    if (query.status) qb.andWhere('e.status = :st', { st: String(query.status).toLowerCase() });
    const branchFilter = effectiveBranchFilter(user, query.branch_id);
    if (branchFilter) qb.andWhere('st.branch_id = :b', { b: branchFilter });

    return qb.take(200).getMany();
  }

  async findOne(id: string, user: AuthUser) {
    const e = await this.enrollments.findOne({
      where: { id },
      relations: ['student', 'student.user', 'group', 'group.course'],
    });
    if (!e) throw new NotFoundException('Enrollment not found');
    const branchFilter = effectiveBranchFilter(user);
    // Students may always view their OWN enrollments (self-service booking
    // flow) even when branch data is missing; staff stay branch-scoped.
    const requesterId = user?.id ?? user?.userId;
    const isOwnEnrollment = Boolean(requesterId) && e.student?.user_id === requesterId;
    if (!isOwnEnrollment && branchFilter && e.student?.branch_id !== branchFilter) {
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

