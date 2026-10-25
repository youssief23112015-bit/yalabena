import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Employee } from '../../../shared/entities/employee.entity';
import { LeaveRequest } from '../../../shared/entities/leave-request.entity';
import { PayrollEntry } from '../../../shared/entities/payroll-entry.entity';
import { BaseMetricService } from './base-metric.service';
import { AuthUser } from '../../../common/utils/branch-scope';
import { DashboardQueryDto, KpiResult, AlertItem } from '../dashboard.dto';

@Injectable()
export class HrMetricService extends BaseMetricService {
  constructor(
    config: ConfigService,
    @InjectRepository(Employee) private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(LeaveRequest) private readonly leaveRepo: Repository<LeaveRequest>,
    @InjectRepository(PayrollEntry) private readonly payrollRepo: Repository<PayrollEntry>,
  ) {
    super(config);
  }

  async getMetrics(user: AuthUser, dto: DashboardQueryDto) {
    const now = new Date();
    const today = this.startOfPeriod(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalEmployees,
      pendingLeaves,
      approvedLeavesThisMonth,
      payrollThisMonth,
    ] = await Promise.all([
      this.countEmployees().catch(() => 0),
      this.countPendingLeaves().catch(() => 0),
      this.countApprovedLeavesThisMonth(startOfMonth).catch(() => 0),
      this.sumPayrollThisMonth(startOfMonth).catch(() => 0),
    ]);

    const kpis: Record<string, KpiResult> = {
      total_employees: { value: totalEmployees, previous_value: 0, change_pct: 0 },
      pending_leaves: { value: pendingLeaves, previous_value: 0, change_pct: 0 },
      leaves_this_month: { value: approvedLeavesThisMonth, previous_value: 0, change_pct: 0 },
      payroll_this_month: {
        value: Number(payrollThisMonth.toFixed(2)),
        previous_value: 0,
        change_pct: 0,
      },
    };

    const alerts: AlertItem[] = [];
    if (pendingLeaves > 0) {
      alerts.push({
        id: 'pending-leaves',
        title: 'Pending Leave Requests',
        description: `${pendingLeaves} leave request(s) awaiting approval`,
        severity: 'warning',
        link: '/hr/leaves',
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

  private async countEmployees(): Promise<number> {
    const qb = this.employeeRepo.createQueryBuilder('e');
    return qb.getCount();
  }

  private async countPendingLeaves(): Promise<number> {
    const qb = this.leaveRepo.createQueryBuilder('l')
      .where("l.status = :status", { status: 'pending' });
    return qb.getCount();
  }

  private async countApprovedLeavesThisMonth(from: Date): Promise<number> {
    const qb = this.leaveRepo.createQueryBuilder('l')
      .where("l.status = :status", { status: 'approved' })
      .andWhere('l.start_date >= :from', { from });
    return qb.getCount();
  }

  private async sumPayrollThisMonth(from: Date): Promise<number> {
    const qb = this.payrollRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.net_pay), 0)', 'total')
      .where('p.paid_date >= :from', { from });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }
}