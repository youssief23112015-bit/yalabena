import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from '../../../shared/entities/payment.entity';
import { Invoice } from '../../../shared/entities/invoice.entity';
import { Enrollment } from '../../../shared/entities/enrollment.entity';
import { BaseMetricService } from './base-metric.service';
import { AuthUser } from '../../../common/utils/branch-scope';
import { DashboardQueryDto, KpiResult, AlertItem } from '../dashboard.dto';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';

@Injectable()
export class FinanceMetricService extends BaseMetricService {
  constructor(
    config: ConfigService,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
  ) {
    super(config);
  }

  async getMetrics(user: AuthUser, dto: DashboardQueryDto) {
    const now = new Date();
    const today = this.startOfPeriod(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      revenueToday,
      prevRevenueToday,
      revenueMonth,
      prevRevenueMonth,
      outstandingPayments,
      totalEnrollments,
    ] = await Promise.all([
      this.sumPayments(today).catch(() => 0),
      this.sumPaymentsPrevDay().catch(() => 0),
      this.sumPayments(startOfMonth).catch(() => 0),
      this.sumPayments(prevMonth, prevMonthEnd).catch(() => 0),
      this.sumOutstanding().catch(() => 0),
      this.countEnrollments().catch(() => 0),
    ]);

    const kpis: Record<string, KpiResult> = {
      revenue_today: this.makeKpi(revenueToday, prevRevenueToday),
      revenue_month: this.makeKpi(revenueMonth, prevRevenueMonth),
      outstanding_payments: { value: outstandingPayments, previous_value: 0, change_pct: 0 },
      total_enrollments: { value: totalEnrollments, previous_value: 0, change_pct: 0 },
      collection_rate: outstandingPayments > 0
        ? this.makeKpi(Math.round(((revenueMonth - outstandingPayments) / revenueMonth) * 100), 0)
        : { value: 100, previous_value: 0, change_pct: 0 },
    };

    const alerts: AlertItem[] = [];
    if (outstandingPayments > 0) {
      alerts.push({
        id: 'outstanding-payments',
        title: 'Outstanding Payments',
        description: `${outstandingPayments} in unpaid invoices require attention`,
        severity: 'warning',
        link: '/finance/invoices',
        created_at: now.toISOString(),
      });
    }

    return {
      kpis,
      time_series: {},
      alerts,
      recent_items: {},
      attendance_summary: { present: 0, absent: 0, late: 0 },
    };
  }

  private async sumPayments(from: Date, to?: Date): Promise<number> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: 'completed' })
      .andWhere('p.paid_at >= :from', { from });
    if (to) qb.andWhere('p.paid_at <= :to', { to });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }

  private async sumPaymentsPrevDay(): Promise<number> {
    const yesterday = new Date(Date.now() - 86_400_000);
    return this.sumPayments(yesterday);
  }

  private async sumOutstanding(): Promise<number> {
    const qb = this.invoiceRepo
      .createQueryBuilder('i')
      .select('COALESCE(SUM(i.balance_due), 0)', 'total')
      .where("i.status IN (:...statuses)", { statuses: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }

  private async countEnrollments(): Promise<number> {
    const qb = this.enrollmentRepo.createQueryBuilder('e');
    return qb.getCount();
  }
}