import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Group } from '../../../shared/entities/group.entity';
import { Session } from '../../../shared/entities/session.entity';
import { Attendance } from '../../../shared/entities/attendance.entity';
import { GroupStudent } from '../../../shared/entities/group-student.entity';
import { BaseMetricService } from './base-metric.service';
import { AuthUser } from '../../../common/utils/branch-scope';
import { DashboardQueryDto, KpiResult, AlertItem } from '../dashboard.dto';

@Injectable()
export class AcademicMetricService extends BaseMetricService {
  constructor(
    config: ConfigService,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Attendance) private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(GroupStudent) private readonly gsRepo: Repository<GroupStudent>,
  ) {
    super(config);
  }

  async getMetrics(user: AuthUser, dto: DashboardQueryDto) {
    const now = new Date();
    const today = this.startOfPeriod(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalGroups,
      activeGroups,
      totalSessions,
      sessionsToday,
      attendanceSummary,
      fillRate,
    ] = await Promise.all([
      this.countGroups().catch(() => 0),
      this.countActiveGroups().catch(() => 0),
      this.countSessions().catch(() => 0),
      this.countSessionsToday(today).catch(() => 0),
      this.getAttendanceSummary().catch(() => ({ present: 0, absent: 0, late: 0 })),
      this.computeGroupFillRate().catch(() => this.makeKpi(0, 0)),
    ]);

    const kpis: Record<string, KpiResult> = {
      total_groups: { value: totalGroups, previous_value: 0, change_pct: 0 },
      active_groups: { value: activeGroups, previous_value: 0, change_pct: 0 },
      total_sessions: { value: totalSessions, previous_value: 0, change_pct: 0 },
      sessions_today: { value: sessionsToday, previous_value: 0, change_pct: 0 },
      group_fill_rate: fillRate,
      attendance_rate: attendanceSummary.present + attendanceSummary.absent + attendanceSummary.late > 0
        ? this.makeKpi(
            Math.round((attendanceSummary.present / (attendanceSummary.present + attendanceSummary.absent + attendanceSummary.late)) * 100),
            0,
          )
        : { value: 0, previous_value: 0, change_pct: 0 },
    };

    const alerts: AlertItem[] = [];
    const lowFillGroups = fillRate.value < 50;
    if (lowFillGroups) {
      alerts.push({
        id: 'low-fill-rate',
        title: 'Low Group Fill Rate',
        description: 'Group fill rate is below 50%. Consider promoting underfilled groups.',
        severity: 'warning',
        link: '/groups',
        created_at: now.toISOString(),
      });
    }

    return {
      kpis,
      time_series: {},
      alerts,
      recent_items: {},
      attendance_summary: {
        present: attendanceSummary.present,
        absent: attendanceSummary.absent,
        late: attendanceSummary.late,
      },
    };
  }

  private async countGroups(): Promise<number> {
    const qb = this.groupRepo.createQueryBuilder('g');
    return qb.getCount();
  }

  private async countActiveGroups(): Promise<number> {
    const qb = this.groupRepo.createQueryBuilder('g')
      .where("g.status = :status", { status: 'active' });
    return qb.getCount();
  }

  private async countSessions(): Promise<number> {
    const qb = this.sessionRepo.createQueryBuilder('s')
      .leftJoin('s.group', 'g');
    return qb.getCount();
  }

  private async countSessionsToday(today: Date): Promise<number> {
    const qb = this.sessionRepo.createQueryBuilder('s')
      .leftJoin('s.group', 'g')
      .where('s.date = :d', { d: today })
      .andWhere('s.cancelled_at IS NULL');
    return qb.getCount();
  }

  private async getAttendanceSummary() {
    const qb = this.attendanceRepo
      .createQueryBuilder('a')
      .select("a.status", 'status')
      .addSelect('COUNT(a.id)', 'count')
      .groupBy('a.status');
    const rows = await qb.getRawMany();
    const summary = { present: 0, absent: 0, late: 0 };
    for (const row of rows) {
      const key = String(row.status).toLowerCase();
      if (key in summary) {
        (summary as Record<string, number>)[key] = Number(row.count);
      }
    }
    return summary;
  }

  private async computeGroupFillRate(): Promise<KpiResult> {
    const qb = this.groupRepo
      .createQueryBuilder('g')
      .select('COALESCE(SUM(g.capacity), 0)', 'capacity');
    const capacityRow = await qb.getRawOne();
    const capacity = Number(capacityRow?.capacity ?? 0);

    const enrolledQb = this.gsRepo.createQueryBuilder('gs')
      .select('COUNT(*)', 'enrolled')
      .where("gs.status = :status", { status: 'active' });
    const enrolledRow = await enrolledQb.getRawOne();
    const enrolled = Number(enrolledRow?.enrolled ?? 0);

    return this.makeKpi(capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0, 0);
  }
}