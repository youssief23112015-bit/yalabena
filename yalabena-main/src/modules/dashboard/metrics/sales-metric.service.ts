import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Lead } from '../../../shared/entities/lead.entity';
import { Student } from '../../../shared/entities/student.entity';
import { BaseMetricService } from './base-metric.service';
import { AuthUser } from '../../../common/utils/branch-scope';
import { DashboardQueryDto, KpiResult, AlertItem } from '../dashboard.dto';

@Injectable()
export class SalesMetricService extends BaseMetricService {
  constructor(
    config: ConfigService,
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
  ) {
    super(config);
  }

  async getMetrics(user: AuthUser, dto: DashboardQueryDto) {
    const now = new Date();
    const today = this.startOfPeriod(now);
    const prevDay = new Date(Date.now() - 86_400_000);

    const [
      totalLeads,
      prevTotalLeads,
      totalStudents,
      prevTotalStudents,
      newLeadsToday,
    ] = await Promise.all([
      this.countLeads().catch(() => 0),
      this.countLeadsFrom(prevDay).catch(() => 0),
      this.countStudents().catch(() => 0),
      this.countStudentsFrom(prevDay).catch(() => 0),
      this.countLeadsFrom(today).catch(() => 0),
    ]);

    const kpis: Record<string, KpiResult> = {
      total_leads: this.makeKpi(totalLeads, prevTotalLeads),
      total_students: this.makeKpi(totalStudents, prevTotalStudents),
      new_leads_today: { value: newLeadsToday, previous_value: 0, change_pct: 0 },
      conversion_rate: totalLeads > 0
        ? this.makeKpi(Math.round((totalStudents / totalLeads) * 100), 0)
        : { value: 0, previous_value: 0, change_pct: 0 },
    };

    const alerts: AlertItem[] = [];
    if (newLeadsToday === 0) {
      alerts.push({
        id: 'no-new-leads',
        title: 'No New Leads Today',
        description: 'No new leads were created today. Consider launching a campaign.',
        severity: 'info',
        link: '/leads',
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

  private async countLeads(): Promise<number> {
    const qb = this.leadRepo.createQueryBuilder('l');
    return qb.getCount();
  }

  private async countLeadsFrom(fromDate: Date): Promise<number> {
    const qb = this.leadRepo.createQueryBuilder('l')
      .where('l.created_at >= :d', { d: fromDate });
    return qb.getCount();
  }

  private async countStudents(): Promise<number> {
    const qb = this.studentRepo.createQueryBuilder('s');
    return qb.getCount();
  }

  private async countStudentsFrom(fromDate: Date): Promise<number> {
    const qb = this.studentRepo.createQueryBuilder('s')
      .where('s.created_at >= :d', { d: fromDate });
    return qb.getCount();
  }
}