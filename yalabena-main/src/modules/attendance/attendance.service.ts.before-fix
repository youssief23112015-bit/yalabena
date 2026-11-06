import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class AttendancesService {
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
  ) {}

  // ---------- helpers ----------

  private dateStr(d: Date): string {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
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

  private minutesBetween(startTime: string, now: Date): number {
    const [h, m] = startTime.split(':').map(Number);
    const start = new Date(now);
    start.setHours(h, m, 0, 0);
    return Math.max(0, Math.round((now.getTime() - start.getTime()) / 60000));
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

  async mark(sessionId: string, dto: MarkAttendanceDto, userId?: string): Promise<Attendance> {
    const session = await this.getSessionOrFail(sessionId);

    if (session.attendance_locked) {
      throw new BadRequestException('Attendance for this session is locked.');
    }

    let attendance = await this.repo.findOne({
      where: { session_id: sessionId, student_id: dto.student_id },
    });

    const minutesLate =
      dto.minutes_late ??
      (dto.status === AttendanceStatus.LATE ? this.minutesBetween(session.start_time, new Date()) : 0);

    if (attendance) {
      attendance.status = dto.status;
      attendance.notes = dto.notes ?? attendance.notes;
      attendance.minutes_late = minutesLate;
      attendance.created_by = userId ?? attendance.created_by;
      if (dto.status === AttendanceStatus.PRESENT || dto.status === AttendanceStatus.LATE) {
        attendance.check_in_time = attendance.check_in_time ?? new Date();
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

    return this.repo.save(attendance);
  }

  async bulkMark(sessionId: string, records: MarkAttendanceDto[], userId?: string) {
    const results: Attendance[] = [];
    for (const record of records) {
      results.push(await this.mark(sessionId, record, userId));
    }
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

    if (this.dateStr(new Date(session.date as any)) !== this.dateStr(new Date())) {
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
    const minutesLate = this.minutesBetween(session.start_time, now);

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
      .select('attendance.status', 'status')
      .addSelect('COUNT(attendance.id)', 'count')
      .where('attendance.student_id = :studentId', { studentId });

    if (from) qb.andWhere('attendance.created_at >= :from', { from });
    if (to) qb.andWhere('attendance.created_at <= :to', { to });

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
