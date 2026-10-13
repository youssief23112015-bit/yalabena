import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Attendance } from '../../shared/entities/attendance.entity';
import { Session } from '../../shared/entities/session.entity';
import { Student } from '../../shared/entities/student.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { AttendanceStatus } from '../../common/enums/attendance-status.enum';
import { CheckInMethod } from '../../common/enums/check-in-method.enum';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { CheckInDto } from './dto/check-in.dto';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class AttendancesService {
  private readonly logger = new Logger(AttendancesService.name);

  constructor(
    @InjectRepository(Attendance)
    private readonly repo: Repository<Attendance>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(GroupStudent)
    private readonly groupStudentRepo: Repository<GroupStudent>,
    private readonly config: ConfigService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * CHAT sync: whenever attendance is saved for a session, the section's
   * (= session's group's) chat room is re-synced so the teacher, the
   * substitute and every ACTIVE student are seated — one call per save, even
   * for bulk marking. Failures are logged but never break attendance
   * operations (same policy as groups/enrollments chat sync).
   */
  private async syncSectionChatSafely(groupId: string): Promise<void> {
    try {
      await this.chatService.syncSectionChatRoom(groupId);
    } catch (err: any) {
      this.logger.warn(`Section chat sync failed for group ${groupId}: ${err?.message ?? err}`);
    }
  }

  // ---------- helpers ----------

  /**
   * Session dates are business-calendar dates, not UTC dates. Configure
   * APP_TIME_ZONE for the academy (defaults to Africa/Cairo) so QR codes and
   * same-day checks remain consistent around midnight.
   */
  private get timeZone(): string {
    return this.config.get<string>('APP_TIME_ZONE', 'Africa/Cairo');
  }

  private dateStr(d: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  private dateKey(value: Date | string): string {
    // TypeORM/Postgres often returns a DATE column as a YYYY-MM-DD string.
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }
    return this.dateStr(value instanceof Date ? value : new Date(value));
  }

  private clockMinutes(d: Date): number {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: this.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(d);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return hour * 60 + minute;
  }

  /** Signed check-in code for a session on a given day (embedded in the QR card). */
  generateCheckInCode(sessionId: string, date?: Date): string {
    const day = this.dateStr(date ?? new Date());
    const secret = this.config.get<string>('JWT_SECRET', 'speakup-fallback-secret');
    return createHmac('sha256', secret).update(`${sessionId}:${day}`).digest('hex').slice(0, 8).toUpperCase();
  }

  private verifyCheckInCode(sessionId: string, code: string): boolean {
    const expected = this.generateCheckInCode(sessionId);
    const a = Buffer.from(expected);
    const b = Buffer.from(code.toUpperCase().trim());
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private minutesBetween(startTime: string, now: Date, sessionDate?: Date | string): number {
    if (sessionDate && this.dateKey(sessionDate) !== this.dateStr(now)) return 0;
    const [h, m] = startTime.split(':').map(Number);
    return Math.max(0, this.clockMinutes(now) - (h * 60 + m));
  }

  private async getSessionOrFail(sessionId: string): Promise<Session> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }
    return session;
  }

  // ---------- roster & marking ----------

  /** Full roster for a session: every active group student + any recorded attendance. */
  async getRoster(sessionId: string) {
    const session = await this.getSessionOrFail(sessionId);
    const groupStudents = await this.groupStudentRepo.find({
      where: { group_id: session.group_id, status: 'active' },
      relations: ['student', 'student.user'],
      order: { enrolled_at: 'ASC' },
    });
    const attendances = await this.repo.find({
      where: { session_id: sessionId },
      relations: ['student', 'student.user'],
    });
    return {
      session,
      students: groupStudents.map((gs) => gs.student),
      attendances,
    };
  }

  async mark(
    sessionId: string,
    dto: MarkAttendanceDto,
    userId?: string,
    opts?: { skipChatSync?: boolean },
  ): Promise<Attendance> {
    const session = await this.getSessionOrFail(sessionId);

    if (session.cancelled_at) {
      throw new BadRequestException('This session has been cancelled.');
    }

    if (session.attendance_locked) {
      throw new BadRequestException('Attendance for this session is locked.');
    }

    const enrolled = await this.groupStudentRepo.findOne({
      where: { group_id: session.group_id, student_id: dto.student_id, status: 'active' },
    });
    if (!enrolled) {
      throw new BadRequestException('This student is not actively enrolled in the session group.');
    }

    let attendance = await this.repo.findOne({
      where: { session_id: sessionId, student_id: dto.student_id },
    });

    const minutesLate =
      dto.minutes_late ??
      (dto.status === AttendanceStatus.LATE
        ? this.minutesBetween(session.start_time, new Date(), session.date)
        : 0);

    if (attendance) {
      attendance.status = dto.status;
      attendance.notes = dto.notes ?? attendance.notes;
      attendance.minutes_late = minutesLate;
      attendance.created_by = userId ?? attendance.created_by;
      if (dto.status === AttendanceStatus.PRESENT || dto.status === AttendanceStatus.LATE) {
        attendance.check_in_time = attendance.check_in_time ?? new Date();
      } else {
        attendance.check_in_time = null;
      }
    } else {
      attendance = this.repo.create({
        session_id: sessionId,
        student_id: dto.student_id,
        status: dto.status,
        notes: dto.notes ?? null,
        minutes_late: minutesLate,
        check_in_method: CheckInMethod.MANUAL,
        check_in_time:
          dto.status === AttendanceStatus.PRESENT || dto.status === AttendanceStatus.LATE
            ? new Date()
            : null,
        created_by: userId ?? null,
      });
    }

    const saved = await this.repo.save(attendance);
    // CHAT sync: keep the section's chat roster fresh (skipped for bulkMark,
    // which performs ONE sync for the whole batch below).
    if (!opts?.skipChatSync) {
      await this.syncSectionChatSafely(session.group_id);
    }
    return saved;
  }

  async bulkMark(sessionId: string, records: MarkAttendanceDto[], userId?: string) {
    const session = await this.getSessionOrFail(sessionId);
    const results: Attendance[] = [];
    for (const record of records) {
      results.push(await this.mark(sessionId, record, userId, { skipChatSync: true }));
    }
    // ONE chat-room sync for the whole attendance batch (section = group).
    await this.syncSectionChatSafely(session.group_id);
    return { marked: results.length, attendances: results };
  }

  // ---------- self check-in (QR / code) ----------

  async selfCheckIn(dto: CheckInDto, userId: string): Promise<Attendance> {
    const session = await this.getSessionOrFail(dto.session_id);

    if (session.cancelled_at) {
      throw new BadRequestException('This session has been cancelled.');
    }

    if (!this.verifyCheckInCode(dto.session_id, dto.code)) {
      throw new BadRequestException('Invalid or expired check-in code.');
    }

    if (this.dateKey(session.date as unknown as Date | string) !== this.dateStr(new Date())) {
      throw new BadRequestException('Check-in is only allowed on the session day.');
    }

    const student = await this.studentRepo.findOne({ where: { user_id: userId } });
    if (!student) {
      throw new NotFoundException('No student profile is linked to this account.');
    }

    const enrolled = await this.groupStudentRepo.findOne({
      where: { group_id: session.group_id, student_id: student.id, status: 'active' },
    });
    if (!enrolled) {
      throw new BadRequestException('You are not enrolled in this group.');
    }

    const now = new Date();
    const minutesLate = this.minutesBetween(session.start_time, now, session.date);

    let attendance = await this.repo.findOne({
      where: { session_id: session.id, student_id: student.id },
    });
    if (attendance && attendance.check_in_time) {
      throw new BadRequestException('You have already checked in for this session.');
    }

    if (attendance) {
      attendance.status = minutesLate > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
      attendance.check_in_method = dto.method ?? CheckInMethod.QR_CODE;
      attendance.check_in_time = now;
      attendance.minutes_late = minutesLate;
    } else {
      attendance = this.repo.create({
        session_id: session.id,
        student_id: student.id,
        status: minutesLate > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        check_in_method: dto.method ?? CheckInMethod.QR_CODE,
        check_in_time: now,
        minutes_late: minutesLate,
      });
    }

    return this.repo.save(attendance);
  }

  // ---------- queries & reports ----------

  async getForSession(sessionId: string) {
    await this.getSessionOrFail(sessionId);
    return this.repo.find({
      where: { session_id: sessionId },
      relations: ['student', 'student.user'],
      order: { created_at: 'ASC' },
    });
  }

  async getStudentReport(studentId: string, from?: Date, to?: Date) {
    const qb = this.repo.createQueryBuilder('attendance')
      .innerJoin('attendance.session', 'session')
      .select('attendance.status', 'status')
      .addSelect('COUNT(attendance.id)', 'count')
      .where('attendance.student_id = :studentId', { studentId });

    if (from) qb.andWhere('session.date >= :from', { from: this.dateKey(from) });
    if (to) qb.andWhere('session.date <= :to', { to: this.dateKey(to) });

    const rows = await qb.groupBy('attendance.status').getRawMany();
    const summary: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      summary[row.status] = Number(row.count);
      total += Number(row.count);
    }
    return { student_id: studentId, total, by_status: summary };
  }

  async getGroupReport(groupId: string, from?: Date, to?: Date) {
    const qb = this.repo.createQueryBuilder('attendance')
      .innerJoin('attendance.session', 'session', 'session.group_id = :groupId', { groupId })
      .select('attendance.student_id', 'student_id')
      .addSelect('attendance.status', 'status')
      .addSelect('COUNT(attendance.id)', 'count')
      .groupBy('attendance.student_id')
      .addGroupBy('attendance.status');

    if (from) qb.andWhere('session.date >= :from', { from: this.dateStr(from) });
    if (to) qb.andWhere('session.date <= :to', { to: this.dateStr(to) });

    const rows = await qb.getRawMany();
    const byStudent: Record<string, any> = {};
    for (const row of rows) {
      byStudent[row.student_id] = byStudent[row.student_id] ?? { student_id: row.student_id, by_status: {}, total: 0 };
      byStudent[row.student_id].by_status[row.status] = Number(row.count);
      byStudent[row.student_id].total += Number(row.count);
    }
    return { group_id: groupId, students: Object.values(byStudent) };
  }

  /** Students with absences >= threshold (default 3) — for absence alerts (SRS 4.5.3). */
  async absenceAlerts(threshold = 3, groupId?: string) {
    const qb = this.repo.createQueryBuilder('attendance')
      .select('attendance.student_id', 'student_id')
      .addSelect('COUNT(attendance.id)', 'absences')
      .innerJoin('attendance.session', 'session')
      .where('attendance.status = :absent', { absent: AttendanceStatus.ABSENT })
      .andWhere('session.cancelled_at IS NULL')
      .groupBy('attendance.student_id')
      .having('COUNT(attendance.id) >= :threshold', { threshold });

    if (groupId) {
      qb.andWhere('session.group_id = :groupId', { groupId });
    }

    const rows = await qb.getRawMany();
    return { threshold, flagged: rows.map((r) => ({ student_id: r.student_id, absences: Number(r.absences) })) };
  }
}
