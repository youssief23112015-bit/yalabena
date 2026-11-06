import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Session } from '../../../shared/entities/session.entity';
import { Attendance } from '../../../shared/entities/attendance.entity';
import { Group } from '../../../shared/entities/group.entity';
import { GroupStudent } from '../../../shared/entities/group-student.entity';
import { BaseMetricService } from './base-metric.service';
import { AuthUser } from '../../../common/utils/branch-scope';
import { DashboardQueryDto, KpiResult, AlertItem } from '../dashboard.dto';

@Injectable()
export class TeacherMetricService extends BaseMetricService {
  constructor(
    config: ConfigService,
    @InjectRepository(Session) private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Attendance) private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(GroupStudent) private readonly gsRepo: Repository<GroupStudent>,
  ) {
    super(config);
  }

  async getMetrics(user: AuthUser, dto: DashboardQueryDto) {
    const userId = user.id;
    const now = new Date();
    const today = this.startOfPeriod(now);

    const [
      myGroups,
      mySessionsToday,
      mySessionsThisWeek,
      myStudents,
      attendanceToday,
      upcomingSessions,
      pendingAttendance,
    ] = await Promise.all([
      this.countMyGroups(userId).catch(() => 0),
      this.countMySessionsToday(userId, today).catch(() => 0),
      this.countMySessionsThisWeek(userId, today).catch(() => 0),
      this.countMyStudents(userId).catch(() => 0),
      this.getAttendanceToday(userId, today).catch(() => ({ present: 0, absent: 0, late: 0 })),
      this.getUpcomingSessions(userId, 5).catch(() => []),
      this.getPendingAttendance(userId, today).catch(() => 0),
    ]);

    const kpis: Record<string, KpiResult> = {
      my_groups: { value: myGroups, previous_value: 0, change_pct: 0 },
      sessions_today: { value: mySessionsToday, previous_value: 0, change_pct: 0 },
      sessions_this_week: { value: mySessionsThisWeek, previous_value: 0, change_pct: 0 },
      my_students: { value: myStudents, previous_value: 0, change_pct: 0 },
      attendance_today: {
        value: attendanceToday.present,
        previous_value: 0,
        change_pct: 0,
      },
    };

    const alerts: AlertItem[] = [];
    if (pendingAttendance > 0) {
      alerts.push({
        id: 'pending-attendance',
        title: 'Pending Attendance',
        description: `${pendingAttendance} session(s) need attendance recorded today`,
        severity: 'warning',
        link: '/sessions',
        created_at: now.toISOString(),
      });
    }

    return {
      kpis,
      time_series: {},
      alerts,
      recent_items: {
        upcoming_sessions: upcomingSessions,
      },
      attendance_summary: {
        present: attendanceToday.present,
        absent: attendanceToday.absent,
        late: attendanceToday.late,
      },
    };
  }

  private async countMyGroups(userId: string): Promise<number> {
    const qb = this.groupRepo
      .createQueryBuilder('g')
      .where('g.teacher_id = :uid OR g.substitute_teacher_id = :uid', { uid: userId });
    return qb.getCount();
  }

  private async countMySessionsToday(userId: string, today: Date): Promise<number> {
    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .innerJoin('s.group', 'g')
      .where('(g.teacher_id = :uid OR g.substitute_teacher_id = :uid)', { uid: userId })
      .andWhere('s.date = :d', { d: today })
      .andWhere('s.cancelled_at IS NULL');
    return qb.getCount();
  }

  private async countMySessionsThisWeek(userId: string, today: Date): Promise<number> {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .innerJoin('s.group', 'g')
      .where('(g.teacher_id = :uid OR g.substitute_teacher_id = :uid)', { uid: userId })
      .andWhere('s.date BETWEEN :start AND :end', { start: startOfWeek, end: endOfWeek })
      .andWhere('s.cancelled_at IS NULL');
    return qb.getCount();
  }

  private async countMyStudents(userId: string): Promise<number> {
    const qb = this.gsRepo
      .createQueryBuilder('gs')
      .innerJoin('gs.group', 'g')
      .where('(g.teacher_id = :uid OR g.substitute_teacher_id = :uid)', { uid: userId })
      .andWhere("gs.status = :status", { status: 'active' });
    return qb.getCount();
  }

  private async getAttendanceToday(userId: string, today: Date) {
    const qb = this.attendanceRepo
      .createQueryBuilder('a')
      .select("a.status", 'status')
      .addSelect('COUNT(a.id)', 'count')
      .innerJoin('a.session', 's')
      .innerJoin('s.group', 'g')
      .where('(g.teacher_id = :uid OR g.substitute_teacher_id = :uid)', { uid: userId })
      .andWhere('s.date = :d', { d: today })
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

  private async getUpcomingSessions(userId: string, limit: number = 5) {
    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.group', 'g')
      .where('(g.teacher_id = :uid OR g.substitute_teacher_id = :uid)', { uid: userId })
      .andWhere('s.date >= :d', { d: this.academyToday })
      .andWhere('s.cancelled_at IS NULL')
      .orderBy('s.date', 'ASC')
      .take(limit);
    return qb.getMany();
  }

  private async getPendingAttendance(userId: string, today: Date): Promise<number> {
    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .innerJoin('s.group', 'g')
      .where('(g.teacher_id = :uid OR g.substitute_teacher_id = :uid)', { uid: userId })
      .andWhere('s.date = :d', { d: today })
      .andWhere('s.cancelled_at IS NULL');
    return qb.getCount();
  }
}