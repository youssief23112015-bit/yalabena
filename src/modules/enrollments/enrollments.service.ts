import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { Course } from '../../shared/entities/course.entity';
import { EnrollmentStatus } from '../../common/enums/enrollment-status.enum';
import { AuthUser, effectiveBranchFilter } from '../../common/utils/branch-scope';
import { FinanceService } from '../finance/finance.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment) private readonly enrollments: Repository<Enrollment>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(Group) private readonly groups: Repository<Group>,
    @InjectRepository(Course) private readonly courses: Repository<Course>,
    private readonly finance: FinanceService,
  ) {}

  async create(dto: CreateEnrollmentDto, user: AuthUser) {
    const student = await this.students.findOne({ where: { id: dto.student_id } });
    if (!student) throw new NotFoundException('Student not found');

    const group = await this.groups.findOne({ where: { id: dto.group_id }, relations: ['course'] });
    if (!group) throw new NotFoundException('Group not found');

    const dup = await this.enrollments.findOne({
      where: { student_id: dto.student_id, group_id: dto.group_id, status: In(['PENDING', 'ACTIVE'] as any) },
    });
    if (dup) throw new BadRequestException('Student already has an active enrollment in this group');

    const activeCount = await this.enrollments.count({
      where: { group_id: dto.group_id, status: 'ACTIVE' as EnrollmentStatus },
    });
    if (activeCount >= group.capacity) {
      throw new BadRequestException(`Group is full (capacity ${group.capacity})`);
    }

    const fee = dto.total_fee ?? Number(group.course?.default_price ?? 0);
    const branchId = student.branch_id ?? group.branch_id;

    const enrollment = await this.enrollments.save(
      this.enrollments.create({
        student_id: student.id,
        group_id: group.id,
        status: 'ACTIVE' as EnrollmentStatus,
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
      description: `Enrollment — ${group.course?.name ?? 'Course'} (${group.name})`,
      promo_code: dto.promo_code,
      manual_discount: dto.discount_amount,
      installments_count: dto.installments_count,
      due_days: dto.due_days,
      created_by: user.id,
    });

    enrollment.discount_amount = invoice.discount_amount;
    enrollment.final_amount = invoice.total_amount;
    await this.enrollments.save(enrollment);

    return this.findOne(enrollment.id, user);
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
    if (query.status) qb.andWhere('e.status = :st', { st: query.status });
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
    if (branchFilter && e.student?.branch_id !== branchFilter) {
      throw new NotFoundException('Enrollment not found');
    }
    return e;
  }

  async updateStatus(id: string, dto: UpdateEnrollmentStatusDto, user: AuthUser) {
    const e = await this.findOne(id, user);
    e.status = dto.status as EnrollmentStatus;
    if (dto.status === 'DROPPED') {
      e.dropped_at = new Date();
      e.drop_reason = dto.reason ?? null;
    }
    return this.enrollments.save(e);
  }

  async drop(id: string, reason: string | undefined, user: AuthUser) {
    return this.updateStatus(id, { status: 'DROPPED', reason }, user);
  }
}
