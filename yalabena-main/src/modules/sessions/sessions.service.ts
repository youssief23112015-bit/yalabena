import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Session } from '../../shared/entities/session.entity';
import { Group } from '../../shared/entities/group.entity';
import { Student } from '../../shared/entities/student.entity';
import { ApplyZoomLinkDto } from './dto/apply-zoom-link.dto';
import { Attendance } from '../../shared/entities/attendance.entity';
import { AttendanceStatus } from '../../common/enums/attendance-status.enum';
import { acquireSchedulingLocks } from '../../common/utils/scheduling-locks.util';

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
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  /** Attendance repo without a constructor injection. */
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

  // ─── Conflict detection (SRS 4.5.2) ──────────────────────────

  /**
   * Scheduling conflicts for a candidate session: overlapping sessions in
   * the same group, for the same teacher, or in the same classroom.
   * Returns [] when the window is incomplete — nothing to compare against.
   * `exclude_session_id` skips one session (used when validating an update
   * to that session so it never conflicts with itself).
   * `em` (optional) runs the queries on an open transaction's manager so a
   * locked create/update validates against the same snapshot it writes to.
   */
  async detectConflicts(data: {
    group_id?: string;
    classroom_id?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    exclude_session_id?: string;
  }, em?: EntityManager): Promise<SessionConflict[]> {
    const { group_id, classroom_id, date, start_time, end_time, exclude_session_id } = data;
    if (!date || !start_time || !end_time) return [];

    const conflicts: SessionConflict[] = [];
    const sessionRepo = em ? em.getRepository(Session) : this.repo;
    const groupRepo = em ? em.getRepository(Group) : this.groupRepo;

    const overlapQb = (qb: any, column: string, value: string) => {
      const q = qb
        .select('s.id', 'id')
        .where(`${column} = :value`, { value })
        .andWhere('s.date = :date', { date })
        .andWhere('s.start_time < :end', { end: end_time })
        .andWhere('s.end_time > :start', { start: start_time })
        .andWhere('s.cancelled_at IS NULL');
      if (exclude_session_id) q.andWhere('s.id != :excl', { excl: exclude_session_id });
      return q;
    };

    // 1) Same group overlapping
    if (group_id) {
      const rows = await overlapQb(
        sessionRepo.createQueryBuilder('s'),
        's.group_id',
        group_id,
      ).getRawMany();
      for (const row of rows) {
        conflicts.push({ type: 'group', session_id: row.id });
      }
    }

    // 2) Same teacher overlapping (teacher comes from the group)
    if (group_id) {
      const group = await groupRepo.findOne({ where: { id: group_id } });
      if (group?.teacher_id) {
        const qb = sessionRepo
          .createQueryBuilder('s')
          .select('s.id', 'id')
          .innerJoin('s.group', 'g')
          .where('g.teacher_id = :tid', { tid: group.teacher_id })
          .andWhere('s.date = :date', { date })
          .andWhere('s.start_time < :end', { end: end_time })
          .andWhere('s.end_time > :start', { start: start_time })
          .andWhere('s.cancelled_at IS NULL');
        if (exclude_session_id) qb.andWhere('s.id != :excl', { excl: exclude_session_id });
        const rows = await qb.getRawMany();
        for (const row of rows) {
          conflicts.push({ type: 'teacher', session_id: row.id });
        }
      }
    }

    // 3) Same classroom overlapping
    if (classroom_id) {
      const rows = await overlapQb(
        sessionRepo.createQueryBuilder('s'),
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

    // Default the mode from the group when the caller omits it.
    const group = payload.group_id
      ? await this.groupRepo.findOne({ where: { id: payload.group_id } })
      : null;
    if (!payload.mode && group?.mode) payload.mode = group.mode;

    const insertSession = async (em?: EntityManager): Promise<Session> => {
      // Copy the group's fixed Zoom link into the session so all sessions
      // of an online/hybrid group share the same meeting link. The link is
      // entered once on the Group and never created per-session via API.
      if (group && group.zoom_link) {
        payload.zoom_join_url = group.zoom_link;
        payload.zoom_meeting_id = group.zoom_meeting_id ?? null;
      }
      const target = em ? em.getRepository(Session) : this.repo;
      const session = target.create(payload as Partial<Session>);
      return target.save(session);
    };

    // Conflict detection (SRS 4.5.2) — skipped with force=true (legacy
    // admin override path, unchanged: no checks, no locks, no transaction).
    if (data.force) {
      return insertSession();
    }

    // Serialize against concurrent activations/edits of the same
    // teacher/room/group: row-lock the group, take the teacher/room
    // advisory locks, then run the conflict check and the INSERT in ONE
    // transaction — a racing writer can never slip between check and write.
    return this.dataSource.transaction(async (em) => {
      if (payload.group_id) {
        await em.query(`SELECT id FROM groups WHERE id = $1 FOR UPDATE`, [payload.group_id]);
      }
      await acquireSchedulingLocks(em, [
        group?.teacher_id ? { kind: 'teacher', id: group.teacher_id } : null,
        payload.classroom_id ? { kind: 'room', id: payload.classroom_id } : null,
      ]);
      const conflicts = await this.detectConflicts(
        {
          group_id: payload.group_id,
          classroom_id: payload.classroom_id,
          date: payload.date,
          start_time: payload.start_time,
          end_time: payload.end_time,
        },
        em,
      );
      if (conflicts.length > 0) {
        throw new ConflictException({
          message: 'Scheduling conflict detected',
          conflicts,
        });
      }
      return insertSession(em);
    });
  }

  async findAll(
    groupId?: string,
    user?: { id?: string; userId?: string; roles?: string[] },
  ): Promise<Session[]> {
    const query = this.repo.createQueryBuilder('session')
      .leftJoinAndSelect('session.group', 'group')
      .leftJoinAndSelect('group.teacher', 'teacher');

    if (groupId) {
      query.andWhere('group.id = :groupId', { groupId });
    }

    // Role-based scoping:
    //  - super_admin / academic / branch_manager → see every session.
    //  - teacher → only sessions of groups they are assigned to teach
    //    (group.teacher_id = the teacher's user id).
    //  - student → only sessions of groups they belong to.
    const roles = (user?.roles ?? []).map((role) => String(role).toLowerCase());
    const isGlobalStaff = roles.some((role) =>
      ['super_admin', 'academic', 'branch_manager'].includes(role),
    );
    const isTeacher = roles.includes('teacher');

    if (user && !isGlobalStaff) {
      const userId = user.id ?? user.userId;
      if (isTeacher) {
        // Teachers only see sessions of their own assigned groups.
        query.andWhere('group.teacher_id = :userId', { userId });
      } else {
        // Students only see sessions of groups they belong to (membership via
        // `group_students` or `enrollments`).
        const studentRepo = this.repo.manager.getRepository(Student);
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
    }
    const sessions = await query.getMany();
    // Resolve the fixed per-group meeting URL at read time: sessions created
    // before activation logic (or with a cleared link) fall back to the
    // group's Zoom link, then the group's OnMeet link. Never the other way
    // around — a per-session link always wins.
    return sessions.map((s) => {
      if (!s.zoom_join_url && s.group) {
        s.zoom_join_url = s.group.zoom_link ?? s.group.onmeet_link ?? null;
      }
      return s;
    });
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

    // Editing ONE session: when its schedule window changes, re-validate
    // teacher/room/group conflicts — excluding the session itself. force=true
    // keeps the legacy override behavior of create().
    const currentdate = session.date instanceof Date
      ? session.date.toISOString().slice(0, 10)
      : String(session.date ?? '').slice(0, 10);
    const scheduleChanged =
      (payload.date !== undefined && String(payload.date).slice(0, 10) !== currentdate) ||
      (payload.start_time !== undefined && payload.start_time !== session.start_time) ||
      (payload.end_time !== undefined && payload.end_time !== session.end_time) ||
      (payload.classroom_id !== undefined && payload.classroom_id !== session.classroom_id);
    if (scheduleChanged && !data.force) {
      const merged = {
        group_id: payload.group_id ?? session.group_id,
        classroom_id: payload.classroom_id ?? session.classroom_id,
        date: payload.date ?? currentdate,
        start_time: payload.start_time ?? session.start_time,
        end_time: payload.end_time ?? session.end_time,
      };
      // Serialize against concurrent activations/edits: row-lock the
      // involved groups (old and new), take the teacher/room advisory
      // locks, then run the conflict check and the write in ONE
      // transaction — otherwise this edit can race a group activation and
      // double-book the teacher/room anyway.
      return this.dataSource.transaction(async (em) => {
        const groupIds = [...new Set([session.group_id, merged.group_id].filter(Boolean))].sort();
        if (groupIds.length > 0) {
          await em.query(`SELECT id FROM groups WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE`, [groupIds]);
        }
        const groups = groupIds.length
          ? await em.getRepository(Group).find({ where: { id: In(groupIds) } })
          : [];
        await acquireSchedulingLocks(em, [
          ...groups.map((g) => ({ kind: 'teacher' as const, id: g.teacher_id })),
          { kind: 'room', id: session.classroom_id ?? '' },
          { kind: 'room', id: merged.classroom_id ?? '' },
        ]);
        const conflicts = await this.detectConflicts({ ...merged, exclude_session_id: id }, em);
        if (conflicts.length > 0) {
          throw new ConflictException({
            message: 'Scheduling conflict detected',
            conflicts,
          });
        }
        Object.assign(session, payload);
        return em.getRepository(Session).save(session);
      });
    }

    Object.assign(session, payload);
    return this.repo.save(session);
  }

  /**
   * Apply Zoom link fields to a session, optionally propagating to all
   * sessions in the same group when `apply_to_all_group_sessions` is true.
   * Safe null-checks: only fields explicitly provided in the DTO are updated.
   */
  async applyZoomLink(
    sessionId: string,
    dto: ApplyZoomLinkDto,
  ): Promise<Session | Session[]> {
    const session = await this.findOne(sessionId);

    const updates: Partial<Session> = {};
    if (dto.zoom_join_url !== undefined) updates.zoom_join_url = dto.zoom_join_url;
    if (dto.zoom_meeting_id !== undefined) updates.zoom_meeting_id = dto.zoom_meeting_id;
    if (Object.keys(updates).length === 0) {
      return session;
    }

    if (dto.apply_to_all_group_sessions === true && session.group_id) {
      const allSessions = await this.repo.find({
        where: { group_id: session.group_id },
      });
      const updated: Session[] = [];
      for (const s of allSessions) {
        Object.assign(s, updates);
        updated.push(await this.repo.save(s));
      }
      return updated;
    }

    Object.assign(session, updates);
    return this.repo.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    await this.repo.remove(session);
  }

  async getAttendance(id: string, teacherId?: string) {
    const session = await this.repo.findOne({
      where: { id },
      relations: ['group'],
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    // Teacher ownership restriction: teachers can only view attendance of
    // sessions belonging to groups they are assigned to teach.
    if (teacherId && session.group && session.group.teacher_id !== teacherId) {
      throw new ForbiddenException(
        'You can only view attendance for sessions of groups you are assigned to teach.',
      );
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
