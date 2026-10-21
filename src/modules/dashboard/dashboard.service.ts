import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from '../../shared/entities/lead.entity';
import { Student } from '../../shared/entities/student.entity';
import { Course } from '../../shared/entities/course.entity';
import { Group } from '../../shared/entities/group.entity';
import { Session } from '../../shared/entities/session.entity';
import { Invoice } from '../../shared/entities/invoice.entity';
import { Payment } from '../../shared/entities/payment.entity';
import { Attendance } from '../../shared/entities/attendance.entity';
import { AuthUser } from '../../common/utils/auth-user';

/**
 * Aggregated KPIs for the dashboard header (SRS 4.2 / 4.17).
 * The academy is 100% online — all counts are global (unscoped).
 */
@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Attendance) private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async getStats(_user: AuthUser) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const results = await Promise.all([
      this.leadRepo.count(),
      this.studentRepo.count(),
      this.courseRepo.count(),
      this.groupRepo.count(),
      this.sessionRepo.count(),

      // Enrolled leads count
      (() => {
        const qb = this.leadRepo.createQueryBuilder('x');
        qb.where('x.status = :s', { s: 'enrolled' });
        return qb.getCount();
      })(),

      this.sumPayments(startOfDay),
      this.sumPayments(startOfMonth),
      this.sumPayments(startOfYear),
      this.sumOutstanding(),
      this.sumGroupCapacity(),
      this.sumEnrolledStudents(),
      this.sessionStats(today),

      this.leadRepo.createQueryBuilder('x').orderBy('x.created_at', 'DESC').take(5).getMany(),

      this.paymentRepo.createQueryBuilder('x').orderBy('x.paid_at', 'DESC').take(5).getMany(),
      this.attendanceBreakdown(),
    ]);

    const [
      total_leads, total_students, total_courses,
      total_groups, total_sessions, enrolled_leads,
      revenue_today, revenue_month, revenue_year, outstanding_payments,
      capacityAgg, enrolledAgg,
      upcoming_sessions, recent_leads, recent_payments, attendance_summary,
    ] = results as any;

    const capacity = Number(capacityAgg?.capacity ?? 0);
    const enrolled = Number(enrolledAgg?.enrolled ?? 0);

    return {
      total_leads,
      total_students,
      total_courses,
      total_groups,
      total_sessions,
      revenue_today: Number(revenue_today ?? 0),
      revenue_month: Number(revenue_month ?? 0),
      revenue_year: Number(revenue_year ?? 0),
      outstanding_payments: Number(outstanding_payments ?? 0),
      conversion_rate: total_leads > 0 ? Math.round((enrolled_leads / total_leads) * 100) : 0,
      teacher_utilization: 0,
      group_fill_rate: capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0,
      recent_leads,
      recent_payments,
      upcoming_sessions,
      attendance_summary,
    };
  }

  // ─── private aggregate helpers ────────────────────────────────

  private async sumPayments(from: Date): Promise<number> {
    const row = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.paid_at >= :from', { from })
      .andWhere("p.status = 'completed'")
      .getRawOne();
    return Number(row?.total ?? 0);
  }

  private async sumOutstanding(): Promise<number> {
    const row = await this.invoiceRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.balance_due), 0)', 'total')
      .where("i.status IN ('UNPAID', 'PARTIAL')")
      .getRawOne();
    return Number(row?.total ?? 0);
  }

  private async sumGroupCapacity(): Promise<{ capacity: number }> {
    return this.groupRepo
      .createQueryBuilder('g')
      .select('COALESCE(SUM(g.capacity), 0)', 'capacity')
      .getRawOne();
  }

  private async sumEnrolledStudents(): Promise<{ enrolled: number }> {
    const row = await this.groupRepo
      .createQueryBuilder('g')
      .select('COUNT(gs.id)', 'enrolled')
      .innerJoin('g.group_students', 'gs')
      .where("gs.status = 'active'")
      .getRawOne();
    return { enrolled: Number(row?.enrolled ?? 0) };
  }

  private async sessionStats(today: Date) {
    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.group', 'g')
      .where('s.date >= :d', { d: today.toISOString().slice(0, 10) })
      .andWhere('s.cancelled_at IS NULL')
      .orderBy('s.date', 'ASC')
      .take(5);
    return qb.getMany();
  }

  private async attendanceBreakdown() {
    const rows = await this.attendanceRepo
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(a.id)', 'count')
      .groupBy('a.status')
      .getRawMany();
    const summary = { present: 0, absent: 0, late: 0 };
    for (const row of rows) {
      const key = String(row.status).toLowerCase();
      if (key in summary) {
        (summary as Record<string, number>)[key] = Number(row.count);
      }
    }
    return summary;
  }
}
