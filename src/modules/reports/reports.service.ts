import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../../shared/entities/lead.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { Session } from '../../shared/entities/session.entity';
import { Attendance } from '../../shared/entities/attendance.entity';
import { Invoice } from '../../shared/entities/invoice.entity';
import { Payment } from '../../shared/entities/payment.entity';
import { Enrollment } from '../../shared/entities/enrollment.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(GroupStudent) private gsRepo: Repository<GroupStudent>,
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Attendance) private attRepo: Repository<Attendance>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
  ) {}

  async salesFunnel(branchId: string | null, from: Date, to: Date) {
    const qb = this.leadRepo.createQueryBuilder('l')
      .select('l.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('l.created_at BETWEEN :from AND :to', { from, to });
    if (branchId) qb.andWhere('l.branch_id = :bid', { bid: branchId });
    return qb.groupBy('l.status').getRawMany();
  }

  async leadSourceRoi(branchId: string | null, from: Date, to: Date) {
    const qb = this.leadRepo.createQueryBuilder('l')
      .select('l.source', 'source')
      .addSelect('COUNT(*)', 'total_leads')
      .addSelect('SUM(CASE WHEN l.status = :enrolled THEN 1 ELSE 0 END)', 'conversions')
      .setParameter('enrolled', 'enrolled')
      .where('l.created_at BETWEEN :from AND :to', { from, to });
    if (branchId) qb.andWhere('l.branch_id = :bid', { bid: branchId });
    return qb.groupBy('l.source').getRawMany();
  }

  async groupFillRate(branchId: string | null) {
    const qb = this.groupRepo.createQueryBuilder('g')
      .select('g.id', 'group_id')
      .addSelect('g.name', 'group_name')
      .addSelect('g.capacity', 'capacity')
      .addSelect('COUNT(gs.id)', 'enrolled')
      .leftJoin('g.group_students', 'gs', 'gs.status = :active', { active: 'active' })
      .groupBy('g.id');
    if (branchId) qb.andWhere('g.branch_id = :bid', { bid: branchId });
    return qb.getRawMany();
  }

  async teacherUtilization(branchId: string | null, month: string) {
    const qb = this.sessionRepo.createQueryBuilder('s')
      .select('u.id', 'teacher_id')
      .addSelect("u.first_name || ' ' || u.last_name", 'teacher_name')
      .addSelect('COUNT(DISTINCT s.id)', 'sessions_count')
      .addSelect('SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600)', 'hours')
      .innerJoin('s.group', 'g')
      .innerJoin('g.teacher', 'u')
      .where("TO_CHAR(s.date, 'YYYY-MM') = :month", { month });
    if (branchId) qb.andWhere('g.branch_id = :bid', { bid: branchId });
    return qb.groupBy('u.id').addGroupBy('u.first_name').addGroupBy('u.last_name').getRawMany();
  }

  async studentProgress(studentId: string) {
    const enrollments = await this.enrollmentRepo.find({
      where: { student_id: studentId },
      relations: ['group', 'group.course'],
    });
    const attendance = await this.attRepo.createQueryBuilder('a')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)", 'present')
      .where('a.student_id = :sid', { sid: studentId })
      .getRawOne();
    return { enrollments, attendance };
  }

  async revenueByPeriod(branchId: string | null, from: Date, to: Date) {
    const qb = this.paymentRepo.createQueryBuilder('p')
      .select("TO_CHAR(p.paid_at, 'YYYY-MM')", 'period')
      .addSelect('SUM(p.amount)', 'total')
      .where('p.status = :status', { status: 'completed' })
      .andWhere('p.paid_at BETWEEN :from AND :to', { from, to });
    if (branchId) {
      qb.innerJoin('p.invoice', 'i').andWhere('i.branch_id = :bid', { bid: branchId });
    }
    return qb.groupBy("TO_CHAR(p.paid_at, 'YYYY-MM')").orderBy('period', 'DESC').getRawMany();
  }

  async outstandingPayments(branchId: string | null) {
    const qb = this.invoiceRepo.createQueryBuilder('i')
      .select('i.id', 'invoice_id')
      .addSelect('i.invoice_number', 'invoice_number')
      .addSelect('i.balance_due', 'balance_due')
      .addSelect('i.due_date', 'due_date')
      .addSelect("u.first_name || ' ' || u.last_name", 'student_name')
      .innerJoin('i.student', 's')
      .innerJoin('s.user', 'u')
      .where('i.status IN (:...statuses)', { statuses: ['unpaid', 'partial', 'overdue'] });
    if (branchId) qb.andWhere('i.branch_id = :bid', { bid: branchId });
    return qb.orderBy('i.due_date', 'ASC').getRawMany();
  }

  async attendanceReport(groupId: string, from: Date, to: Date) {
    return this.attRepo.createQueryBuilder('a')
      .select('s.date', 'session_date')
      .addSelect('a.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('a.session', 's')
      .where('s.group_id = :gid', { gid: groupId })
      .andWhere('s.date BETWEEN :from AND :to', { from, to })
      .groupBy('s.date').addGroupBy('a.status')
      .orderBy('s.date', 'ASC')
      .getRawMany();
  }
}
