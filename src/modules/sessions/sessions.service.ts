import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Session } from '../../shared/entities/session.entity';
import { Group } from '../../shared/entities/group.entity';
import { Student } from '../../shared/entities/student.entity';
import { Attendance } from '../../shared/entities/attendance.entity';
import { AttendanceStatus } from '../../common/enums/attendance-status.enum';
import { GroupMode } from '../../common/enums/group-mode.enum';
import { ZoomService } from '../integrations/zoom.service';
import { OnMeetService } from '../integrations/onmeet.service';

export interface SessionConflict {
  type: 'group' | 'teacher' | 'classroom';
  session_id: string;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly repo: Repository<Session>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    private readonly zoom: ZoomService,
    private readonly onmeet: OnMeetService,
    private readonly config: ConfigService,
  ) {}

  /** Attendance repo without a constructor injection (spec fixes the arity at 5). */
  private get attendances(): Repository<Attendance> {
    return this.repo.manager.getRepository(Attendance);
  }

  // Helpers: extract a plain time (HH:mm:ss) or date (YYYY-MM-DD) from an ISO DateTime string.
  private extractTime(dateTimeStr?: string): string | undefined {
    if (!dateTimeStr) return undefined;
    return dateTimeStr.includes('T') ? dateTimeStr.split('T')[1].substring(0, 8) : dateTimeStr;
  }

  private extractDate(dateTimeStr?: string): string | undefined {
    if (!dateTimeStr) return undefined;
    return dateTimeStr.includes('T') ? dateTimeStr.split('T')[0] : dateTimeStr;
  }

  /** Minutes between two HH:mm:ss strings (for meeting duration). */
  private durationMinutes(start?: string, end?: string): number {
    if (!start || !end) return 60;
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const diff = toMin(end) - toMin(start);
    return diff > 0 ? diff : 60;
  }

  // ─── Conflict detection (SRS 4.5.2) ──────────────────────────

  /**
   * Scheduling conflicts for a candidate session: overlapping sessions in
   * the same group, for the same teacher, or in the same classroom.
   * Returns [] when the window is incomplete — nothing to compare against.
   */
  async detectConflicts(data: {
    group_id?: string;
    classroom_id?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
  }): Promise<SessionConflict[]> {
    const { group_id, classroom_id, date, start_time, end_time } = data;
    if (!date || !start_time || !end_time) return [];

    const conflicts: SessionConflict[] = [];

    const overlapQb = (qb: any, column: string, value: string) =>
      qb
        .select('s.id', 'id')
        .where(`${column} = :value`, { value })
        .andWhere('s.date = :date', { date })
        .andWhere('s.start_time < :end', { end: end_time })
        .andWhere('s.end_time > :start', { start: start_time })
        .andWhere('s.cancelled_at IS NULL');

    // 1) Same group overlapping
    if (group_id) {
      const rows = await overlapQb(
        this.repo.createQueryBuilder('s'),
        's.group_id',
        group_id,
      ).getRawMany();
      for (const row of rows) {
        conflicts.push({ type: 'group', session_id: row.id });
      }
    }

    // 2) Same teacher overlapping (teacher comes from the group)
    if (group_id) {
      const group = await this.groupRepo.findOne({ where: { id: group_id } });
      if (group?.teacher_id) {
        const rows = await this.repo
          .createQueryBuilder('s')
          .select('s.id', 'id')
          .innerJoin('s.group', 'g')
          .where('g.teacher_id = :tid', { tid: group.teacher_id })
          .andWhere('s.date = :date', { date })
          .andWhere('s.start_time < :end', { end: end_time })
          .andWhere('s.end_time > :start', { start: start_time })
          .andWhere('s.cancelled_at IS NULL')
          .getRawMany();
        for (const row of rows) {
          conflicts.push({ type: 'teacher', session_id: row.id });
        }
      }
    }

    // 3) Same classroom overlapping
    if (classroom_id) {
      const rows = await overlapQb(
        this.repo.createQueryBuilder('s'),
        's.classroom_id',
        classroom_id,
      ).getRawMany();
      for (const row of rows) {
        conflicts.push({ type: 'classroom', session_id: row.id });
      }
    }

    return conflicts;
  }

  // ─── CRUD ─────────────────────────────────────────────────────

  async create(data: any): Promise<Session> {
    const rawStartTime = data.start_time || data.startTime;
    const rawEndTime = data.end_time || data.endTime;

    const payload: any = {
      ...data,
      group_id: data.group_id || data.groupId,
      classroom_id: data.classroom_id || data.classroomId,
      teacher_id: data.teacher_id || data.teacherId,
      date: data.date || this.extractDate(rawStartTime),
      start_time: this.extractTime(rawStartTime),
      end_time: this.extractTime(rawEndTime),
    };

    // Conflict detection (SRS 4.5.2) — skipped with force=true.
    if (!data.force) {
      const conflicts = await this.detectConflicts({
        group_id: payload.group_id,
        classroom_id: payload.classroom_id,
        date: payload.date,
        start_time: payload.start_time,
        end_time: payload.end_time,
      });
      if (conflicts.length > 0) {
        throw new ConflictException({
          message: 'Scheduling conflict detected',
          conflicts,
        });
      }
    }

    // Default the mode from the group when the caller omits it.
    const group = payload.group_id
      ? await this.groupRepo.findOne({ where: { id: payload.group_id } })
      : null;
    if (!payload.mode && group?.mode) payload.mode = group.mode;

    // Auto-create a meeting for online/hybrid sessions (SRS 5.1/5.2).
    // Never blocks creation when no provider is configured or all fail.
    if (
      (payload.mode === GroupMode.ONLINE || payload.mode === GroupMode.HYBRID) &&
      !payload.zoom_join_url &&
      !payload.onmeet_meeting_id
    ) {
      await this.attachMeeting(payload, group);
    }

    const session = this.repo.create(payload as Partial<Session>);
    return this.repo.save(session);
  }

  /** Try Zoom, fall back to OnMeet, swallow provider errors (never block). */
  private async attachMeeting(payload: any, group: Group | null) {
    const input = {
      topic: payload.topic || payload.title || group?.name || 'SpeakUp Session',
      startTime: `${payload.date}T${payload.start_time}`,
      duration: this.durationMinutes(payload.start_time, payload.end_time),
    };

    if (this.zoom.isConfigured()) {
      try {
        const meeting = await this.zoom.createMeeting(input);
        payload.zoom_meeting_id = meeting.meeting_id;
        payload.zoom_join_url = meeting.join_url;
        return;
      } catch {
        /* fall through to OnMeet */
      }
    }
    if (this.onmeet.isConfigured()) {
      try {
        const meeting = await this.onmeet.createMeeting(input);
        payload.onmeet_meeting_id = meeting.meeting_id;
        payload.onmeet_join_url = meeting.join_url;
      } catch {
        /* provider down — session still gets created without a link */
      }
    }
  }

  async findAll(
    groupId?: string,
    user?: { id?: string; userId?: string; roles?: string[] },
  ): Promise<Session[]> {
    const query = this.repo.createQueryBuilder('session')
      .leftJoinAndSelect('session.group', 'group');

    if (groupId) {
      query.andWhere('group.id = :groupId', { groupId });
    }

    // Students only see sessions of groups they belong to (membership via
    // `group_students` or `enrollments`). Staff roles keep the full list —
    // @Roles on the controller already guarantees which of these can arrive.
    const roles = (user?.roles ?? []).map((role) => String(role).toLowerCase());
    const isStaff = roles.some((role) =>
      ['super_admin', 'academic', 'teacher'].includes(role),
    );
    if (user && !isStaff) {
      const studentRepo = this.repo.manager.getRepository(Student);
      const userId = user.id ?? user.userId;
      const student = userId
        ? await studentRepo.findOne({ where: { user_id: userId } })
        : null;
      if (!student) return [];

      // Column/table qualifications matter here:
      //  - `group_students.status` is a CHECK-constrained lowercase varchar →
      //    a direct compare is exact and keeps idx_gs_status usable.
      //  - `enrollments.status` is the Postgres ENUM `enrollment_status`.
      //    LOWER() has no enum overload (only text), which produced
      //    `function lower(enrollment_status) does not exist`. Compare on the
      //    text projection instead; this also matches both casings that
      //    circulate in this codebase ('active' from the TS enum vs 'ACTIVE'
      //    written by enrollments.service.create — same rationale as
      //    chat.service), whereas a raw enum-literal comparison would fail at
      //    parse time whenever a label is absent from the live enum.
      const rows: { groupId: string }[] = await this.repo.query(
        `SELECT gs.group_id AS "groupId" FROM group_students gs
           WHERE gs.student_id = $1 AND gs.status = 'active'
         UNION
         SELECT e.group_id AS "groupId" FROM enrollments e
           WHERE e.student_id = $1 AND LOWER(CAST(e.status AS TEXT)) = 'active'`,
        [student.id],
      );
      const groupIds = rows.map((row) => row.groupId).filter(Boolean);
      if (!groupIds.length) return [];
      query.andWhere('group.id IN (:...groupIds)', { groupIds });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.repo.findOne({
      where: { id },
      relations: ['group', 'attendances'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  async update(id: string, data: any): Promise<Session> {
    const session = await this.findOne(id);

    const rawStartTime = data.start_time || data.startTime;
    const rawEndTime = data.end_time || data.endTime;

    const payload = {
      ...data,
      ...(data.groupId || data.group_id ? { group_id: data.group_id || data.groupId } : {}),
      ...(data.classroomId || data.classroom_id ? { classroom_id: data.classroom_id || data.classroomId } : {}),
      ...(data.date || rawStartTime ? { date: data.date || this.extractDate(rawStartTime) } : {}),
      ...(rawStartTime ? { start_time: this.extractTime(rawStartTime) } : {}),
      ...(rawEndTime ? { end_time: this.extractTime(rawEndTime) } : {}),
    };

    Object.assign(session, payload);
    return this.repo.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    await this.repo.remove(session);
  }

  async getAttendance(id: string) {
    const session = await this.repo.findOne({
      where: { id },
      select: ['id'],
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return this.attendances
      .createQueryBuilder('attendance')
      .where('attendance.session_id = :id', { id })
      .getMany();
  }

  // ─── Cancel / lock / attendance recording (frontend Sessions page) ───

  /** Cancel a session, keeping the reason for the audit trail. */
  async cancel(id: string, reason?: string): Promise<Session> {
    const session = await this.findOne(id);
    if (session.cancelled_at) {
      throw new ConflictException('Session is already cancelled');
    }
    session.cancelled_at = new Date();
    session.cancellation_reason = reason ?? null;
    return this.repo.save(session);
  }

  /** Lock attendance so no further marks/check-ins are accepted. */
  async lockAttendance(id: string): Promise<Session> {
    const session = await this.findOne(id);
    if (session.attendance_locked) {
      throw new ConflictException('Attendance is already locked');
    }
    session.attendance_locked = true;
    return this.repo.save(session);
  }

  /** Reject attendance writes on a locked or cancelled session. */
  private assertAttendanceOpen(session: Session) {
    if (session.attendance_locked) {
      throw new BadRequestException('Attendance is locked for this session');
    }
    if (session.cancelled_at) {
      throw new BadRequestException('Session is cancelled');
    }
  }

  /**
   * Bulk-save attendance for a session (upsert by student). The frontend
   * sends `{ attendances: [{ student_id, status, notes? }] }`.
   */
  async recordAttendance(
    id: string,
    records: { student_id: string; status: AttendanceStatus; notes?: string }[],
    userId: string,
  ): Promise<Attendance[]> {
    const session = await this.findOne(id);
    this.assertAttendanceOpen(session);

    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestException('attendances must be a non-empty array');
    }

    const saved: Attendance[] = [];
    for (const record of records) {
      let attendance = await this.attendances.findOne({
        where: { session_id: id, student_id: record.student_id },
      });
      if (attendance) {
        attendance.status = record.status;
        if (record.notes !== undefined) attendance.notes = record.notes;
      } else {
        attendance = this.attendances.create({
          session_id: id,
          student_id: record.student_id,
          status: record.status,
          notes: record.notes,
          created_by: userId,
        });
      }
      saved.push(await this.attendances.save(attendance));
    }
    return saved;
  }

  /** Patch a single attendance record (status and/or notes). */
  async updateAttendance(
    id: string,
    attendanceId: string,
    patch: { status?: AttendanceStatus; notes?: string },
  ): Promise<Attendance> {
    const session = await this.findOne(id);
    this.assertAttendanceOpen(session);

    const attendance = await this.attendances.findOne({
      where: { id: attendanceId, session_id: id },
    });
    if (!attendance) {
      throw new NotFoundException('Attendance record not found for this session');
    }
    if (patch.status !== undefined) attendance.status = patch.status;
    if (patch.notes !== undefined) attendance.notes = patch.notes;
    return this.attendances.save(attendance);
  }
}