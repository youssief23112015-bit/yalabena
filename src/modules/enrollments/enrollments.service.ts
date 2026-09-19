import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { Waitlist } from '../../shared/entities/waitlist.entity';
import { Invoice } from '../../shared/entities/invoice.entity';
import { PromoCode } from '../../shared/entities/promo-code.entity';
import { EnrollmentStatus } from '../../common/enums/enrollment-status.enum';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment) private repo: Repository<Enrollment>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(GroupStudent) private gsRepo: Repository<GroupStudent>,
    @InjectRepository(Waitlist) private waitlistRepo: Repository<Waitlist>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(PromoCode) private promoRepo: Repository<PromoCode>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateEnrollmentDto, userId: string, branchId: string) {
    const student = await this.studentRepo.findOne({ where: { id: dto.student_id } });
    if (!student) throw new NotFoundException('Student not found');

    const group = await this.groupRepo.findOne({ where: { id: dto.group_id } });
    if (!group) throw new NotFoundException('Group not found');

    // Check capacity
    const enrolledCount = await this.gsRepo.count({
      where: { group_id: dto.group_id, status: 'active' },
    });
    if (enrolledCount >= group.capacity) {
      throw new BadRequestException('Group capacity exceeded');
    }

    let discount = 0;
    if (dto.promo_code_id) {
      const promo = await this.promoRepo.findOne({ where: { id: dto.promo_code_id } });
      if (promo) {
        if (promo.type === 'percentage') {
          discount = (dto.total_fee * promo.value) / 100;
          if (promo.max_discount && discount > promo.max_discount) discount = promo.max_discount;
        } else {
          discount = promo.value;
        }
        promo.used_count += 1;
        await this.promoRepo.save(promo);
      }
    }

    const finalAmount = dto.total_fee - discount;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const enrollment = this.repo.create({
        ...dto,
        discount_amount: discount,
        final_amount: finalAmount,
        enrolled_by: userId,
        status: EnrollmentStatus.ACTIVE,
      });
      const saved = await queryRunner.manager.save(enrollment);

      // Add to group_students
      await queryRunner.manager.save(this.gsRepo.create({
        group_id: dto.group_id,
        student_id: dto.student_id,
        enrolled_by: userId,
        status: 'active',
      }));

      // Remove from waitlist if exists
      await queryRunner.manager.update(Waitlist,
        { student_id: dto.student_id, course_id: group.course_id, status: 'waiting' },
        { status: 'enrolled', enrolled_at: new Date() }
      );

      // Auto-generate invoice
      const invoice = this.invoiceRepo.create({
        invoice_number: `INV-${new Date().getFullYear()}-${String(await this.invoiceRepo.count() + 1).padStart(4, '0')}`,
        enrollment_id: saved.id,
        student_id: dto.student_id,
        branch_id: group.branch_id,
        subtotal: dto.total_fee,
        discount_amount: discount,
        tax_amount: 0,
        total_amount: finalAmount,
        paid_amount: 0,
        balance_due: finalAmount,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        created_by: userId,
      });
      await queryRunner.manager.save(invoice);

      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: any, user: any) {
    const qb = this.repo.createQueryBuilder('e')
      .leftJoinAndSelect('e.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('e.group', 'group')
      .orderBy('e.created_at', 'DESC');

    if (!user.roles?.includes('super_admin')) {
      qb.andWhere('group.branch_id = :branchId', { branchId: user.branchId });
    }
    if (query.student_id) qb.andWhere('e.student_id = :sid', { sid: query.student_id });
    if (query.group_id) qb.andWhere('e.group_id = :gid', { gid: query.group_id });
    if (query.status) qb.andWhere('e.status = :status', { status: query.status });

    const [data, total] = await qb.skip(query.offset || 0).take(query.limit || 20).getManyAndCount();
    return { data, total };
  }

  async findOne(id: string, user: any) {
    const enrollment = await this.repo.findOne({
      where: { id },
      relations: ['student', 'student.user', 'group', 'group.course'],
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (!user.roles?.includes('super_admin') && enrollment.group?.branch_id !== user.branchId) {
      throw new ForbiddenException('Access denied');
    }
    return enrollment;
  }

  async updateStatus(id: string, dto: UpdateEnrollmentStatusDto, userId: string) {
    const enrollment = await this.repo.findOne({ where: { id }, relations: ['group'] });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    enrollment.status = dto.status;
    if (dto.status === EnrollmentStatus.DROPPED) {
      enrollment.dropped_at = new Date();
      enrollment.drop_reason = dto.reason;
      // Deactivate group_student
      await this.gsRepo.update(
        { group_id: enrollment.group_id, student_id: enrollment.student_id },
        { status: 'dropped', dropped_at: new Date(), drop_reason: dto.reason },
      );
    }
    return this.repo.save(enrollment);
  }

  async transfer(id: string, newGroupId: string, userId: string) {
    const enrollment = await this.repo.findOne({ where: { id } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const newGroup = await this.groupRepo.findOne({ where: { id: newGroupId } });
    if (!newGroup) throw new NotFoundException('Target group not found');

    const enrolledCount = await this.gsRepo.count({
      where: { group_id: newGroupId, status: 'active' },
    });
    if (enrolledCount >= newGroup.capacity) {
      throw new BadRequestException('Target group capacity exceeded');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Remove from old group
      await queryRunner.manager.update(GroupStudent,
        { group_id: enrollment.group_id, student_id: enrollment.student_id },
        { status: 'transferred' }
      );

      // Add to new group
      await queryRunner.manager.save(this.gsRepo.create({
        group_id: newGroupId,
        student_id: enrollment.student_id,
        enrolled_by: userId,
        status: 'active',
      }));

      enrollment.group_id = newGroupId;
      enrollment.status = EnrollmentStatus.TRANSFERRED;
      await queryRunner.manager.save(enrollment);

      await queryRunner.commitTransaction();
      return enrollment;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
