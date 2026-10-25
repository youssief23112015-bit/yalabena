import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';
import { Session } from '../../shared/entities/session.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupSchedule } from '../../shared/entities/group-schedule.entity';
import { TestSlot } from '../../shared/entities/test-slot.entity';
import { TeacherAvailability } from '../../shared/entities/teacher-availability.entity';
import { Employee } from '../../shared/entities/employee.entity';
import { Classroom } from '../../shared/entities/classroom.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { GroupMode } from '../../common/enums/group-mode.enum';
import { GroupStatus } from '../../common/enums/group-status.enum';
import {
  Occurrence,
  ScheduleWindow,
  dayLabel,
  expandOccurrences,
  humanDate,
  normalizeTime,
  shortTime,
  toMinutes,
  validateScheduleConfig,
} from '../../common/utils/recurring-schedule.util';
import { acquireSchedulingLocks } from '../../common/utils/scheduling-locks.util';
import { AuthUser, assertBranchAccess } from '../../common/utils/branch-scope';

/** Structured conflict line returned to staff when validation fails. */
export interface ScheduleConflict {
  type: 'teacher' | 'classroom' | 'group' | 'reservation';
  message: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  conflicting_group_id?: string;
  conflicting_group_name?: string;
  conflicting_session_id?: string;
  person?: string;
  room?: string;
}

export interface ActivationResult {
  group_id: string;
  status: GroupStatus;
  already_active: boolean;
  total_occurrences: number;
  generated: number;
  from?: string;
  to?: string;
}

export interface RescheduleResult {
  group_id: string;
  effective_date: string;
  total_occurrences: number;
  created: number;
  deleted: number;
  preserved: Array<{ session_id: string; date: string; reason: 'attendance' | 'attendance_locked' | 'cancelled' }>;
}

/** 'YYYY-MM-DD' from a string or a TypeORM `date` column Date (UTC midnight). */
function dateStr(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

/** Half-open interval overlap on the same calendar date. */
function overlapsOnSameDay(
  a: { date: string | Date; start_time: string; end_time: string },
  b: { date: string | Date; start_time: string; end_time: string },
): boolean {
  if (dateStr(a.date) !== dateStr(b.date)) return false;
  const aS = toMinutes(a.start_time);
  const aE = toMinutes(a.end_time);
  const bS = toMinutes(b.start_time);
  const bE = toMinutes(b.end_time);
  if ([aS, aE, bS, bE].some(Number.isNaN)) return false;
  return aS < bE && bS < aE; // partial overlaps count; touching boundaries don't
}

/** Generation horizon: only the next N weeks of occurrences are created on activation. */
export const HORIZON_WEEKS = 8;

/** 'YYYY-MM-DD' today in the academy wall-clock zone (APP_TIME_ZONE, default Africa/Cairo). */
function academyToday(config: ConfigService): string {
  const timeZone = config.get<string>('APP_TIME_ZONE', 'Africa/Cairo');
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

/** Add N weeks to a YYYY-MM-DD date (UTC calendar arithmetic, DST-safe). */
function addWeeks(dateStr: string, weeks: number): string {
  const d = Date.parse(`${dateStr.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d)) return dateStr;
  return new Date(d + weeks * 7 * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Automatic recurring-session scheduling: generation on group activation,
 * idempotent inserts (partial unique index + ON CONFLICT DO NOTHING),
 * teacher/room conflict validation against real session intervals and
 * placement-test reservations, and effective-date reschedules that preserve
 * past sessions and any future session holding attendance history.
 *
 * Every write path runs in one transaction that locks the group row with
 * SELECT … FOR UPDATE, serializing concurrent activations/retries.
 */
@Injectable()
export class SessionSchedulingService {
  private readonly logger = new Logger(SessionSchedulingService.name);
  constructor(
    @InjectRepository(Session)
    private readonly sessions: Repository<Session>,
    @InjectRepository(Group)
    private readonly groups: Repository<Group>,
    @InjectRepository(GroupSchedule)
    private readonly schedules: Repository<GroupSchedule>,
    @InjectRepository(TestSlot)
    private readonly testSlots: Repository<TestSlot>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  // ─── Validation helpers ───────────────────────────────────────

  /** Reject overlapping windows inside the schedule itself (same weekday). */
  private assertWindowsDisjoint(windows: ScheduleWindow[]): void {
    for (let i = 0; i < windows.length; i++) {
      for (let j = i + 1; j < windows.length; j++) {
        const a = windows[i];
        const b = windows[j];
        if (Number(a.day_of_week) !== Number(b.day_of_week)) continue;
        const aS = toMinutes(a.start_time);
        const aE = toMinutes(a.end_time);
        const bS = toMinutes(b.start_time);
        const bE = toMinutes(b.end_time);
        if ([aS, aE, bS, bE].some(Number.isNaN)) continue;
        if (aS < bE && bS < aE) {
          throw new BadRequestException({
            message: 'Invalid recurring schedule configuration',
            errors: [
              `Two schedule entries on ${dayLabel(Number(a.day_of_week))} overlap (${shortTime(a.start_time)}–${shortTime(a.end_time)} and ${shortTime(b.start_time)}–${shortTime(b.end_time)}).`,
            ],
          });
        }
      }
    }
  }

  /**
   * The group's fixed meeting URL rules:
   *  - any URL that is set must be a valid http(s) link;
   *  - ONLINE / HYBRID groups must have a Zoom or OnMeet link — otherwise
   *    students would have no way to join generated sessions.
   */
  private validateMeetingUrl(group: Group): void {
    const errors: string[] = [];
    const check = (value: string | null | undefined, label: string) => {
      if (!value) return;
      let parsed: URL;
      try {
        parsed = new URL(value);
      } catch {
        errors.push(`${label} is not a valid URL: "${value}".`);
        return;
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        errors.push(`${label} must start with http:// or https://.`);
      }
    };
    check(group.zoom_link, 'Zoom link');
    check(group.onmeet_link, 'OnMeet link');

    const online = group.mode === GroupMode.ONLINE || group.mode === GroupMode.HYBRID;
    if (online && !group.zoom_link && !group.onmeet_link) {
      errors.push(
        `This group is ${group.mode} but has no meeting link. Set the group's fixed Zoom link (or OnMeet link) before activating.`,
      );
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Group activation failed: invalid meeting link configuration',
        errors,
      });
    }
  }

  // ─── Conflict detection ───────────────────────────────────────

  /**
   * Validate every occurrence against real bookings:
   *  - teacher: overlapping non-cancelled sessions of OTHER live groups with
   *    the same teacher, plus placement-test slots the teacher examines;
   *  - classroom: overlapping sessions of other groups in the same room;
   *  - group: overlapping sessions already belonging to this group
   *    (skipped for occurrences that are being replaced).
   * Returns structured conflicts; empty array = safe to generate.
   */
  private async findConflicts(
    em: EntityManager,
    group: Group,
    occurrences: Occurrence[],
    opts: { skipSessionIds?: Set<string> } = {},
  ): Promise<ScheduleConflict[]> {
    if (occurrences.length === 0) return [];
    const conflicts: ScheduleConflict[] = [];

    const dates = occurrences.map((o) => o.date);
    const roomIds = [...new Set(occurrences.map((o) => o.classroom_id).filter((r): r is string => Boolean(r)))];

    const sessionRepo = em.getRepository(Session);

    // Candidate sessions: same teacher (via live groups) or same room, within range.
    const candidates = await sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.group', 'g')
      .where('s.cancelled_at IS NULL')
      .andWhere('s.date IN (:...dates)', { dates })
      .andWhere(
        `(g.teacher_id = :teacherId OR s.classroom_id IN (:...rooms) OR s.group_id = :groupId)`,
        { teacherId: group.teacher_id, rooms: roomIds.length ? roomIds : [group.id], groupId: group.id },
      )
      .getMany();

    const teacherName = group.teacher
      ? `${group.teacher.first_name ?? ''} ${group.teacher.last_name ?? ''}`.trim() || 'the assigned teacher'
      : 'the assigned teacher';

    const full = (o: { date: string; start_time: string; end_time: string }) =>
      `${humanDate(o.date)}, from ${shortTime(o.start_time)} to ${shortTime(o.end_time)}`;

    for (const o of occurrences) {
      for (const s of candidates) {
        if (s.group_id === group.id) {
          // Same-group overlap — fine when this session is being replaced…
          if (opts.skipSessionIds?.has(s.id)) continue;
          // …or when it occupies the exact slot of this occurrence (the
          // idempotent reactivation path — ON CONFLICT DO NOTHING skips it).
          if (
            dateStr(o.date) === dateStr(s.date) &&
            shortTime(o.start_time) === shortTime(s.start_time)
          ) {
            continue;
          }
          if (!overlapsOnSameDay(o, s)) continue;
          conflicts.push({
            type: 'group',
            message: `Group already has an overlapping session on ${full(o)} (session ${s.id}).`,
            date: o.date,
            start_time: o.start_time,
            end_time: o.end_time,
            conflicting_session_id: s.id,
            conflicting_group_id: group.id,
            conflicting_group_name: group.name,
          });
          continue;
        }
        if (!overlapsOnSameDay(o, s)) continue;
        const other = s.group;
        // A session of a group that is no longer live (completed/cancelled)
        // does not reserve teacher/room time — mirrors the group-level
        // conflict engine in GroupsService.findScheduleConflicts, which also
        // ignores non-live groups. Rows without a loaded status (defensive)
        // are still treated as reserving.
        if (
          other &&
          other.status !== undefined &&
          other.status !== GroupStatus.UPCOMING &&
          other.status !== GroupStatus.ACTIVE
        ) {
          continue;
        }
        if (other?.teacher_id === group.teacher_id) {
          conflicts.push({
            type: 'teacher',
            message: `Teacher ${teacherName} is already assigned to another Session of "${other?.name ?? 'another group'}" on ${full(o)}.`,
            date: o.date,
            start_time: o.start_time,
            end_time: o.end_time,
            person: teacherName,
            conflicting_group_id: other?.id,
            conflicting_group_name: other?.name,
            conflicting_session_id: s.id,
          });
        }
        if (o.classroom_id && s.classroom_id && String(s.classroom_id) === String(o.classroom_id)) {
          conflicts.push({
            type: 'classroom',
            message: `Room is already reserved during the requested time on ${full(o)} (session of "${other?.name ?? 'another group'}").`,
            date: o.date,
            start_time: o.start_time,
            end_time: o.end_time,
            room: o.classroom_id,
            conflicting_group_id: other?.id,
            conflicting_group_name: other?.name,
            conflicting_session_id: s.id,
          });
        }
      }
    }

    // Teacher reservations: open placement-test slots the teacher examines.
    const slots = await em.getRepository(TestSlot).find({
      where: {
        examiner_id: group.teacher_id,
        date: In(dates),
        status: Not(In(['cancelled' as any, 'completed' as any])),
      },
    });
    for (const o of occurrences) {
      for (const slot of slots) {
        const slotDate = dateStr(slot.date);
        if (!overlapsOnSameDay(o, { date: slotDate, start_time: slot.start_time, end_time: slot.end_time })) {
          continue;
        }
        conflicts.push({
          type: 'reservation',
          message: `Teacher ${teacherName} is reserved for a placement test on ${full(o)}.`,
          date: o.date,
          start_time: o.start_time,
          end_time: o.end_time,
          person: teacherName,
        });
      }
    }

    // ── Q4: Teacher availability ──────────────────────────────────────
    // A session may only be scheduled when the teacher is available
    // (teacher_availabilities) for that weekday and time window.
    try {
      const employee = await em
        .getRepository(Employee)
        .createQueryBuilder('e')
        .where('e.user_id = :uid', { uid: group.teacher_id })
        .getOne();
      if (employee) {
        const availabilities = await em.getRepository(TeacherAvailability).find({
          where: { employee_id: employee.id, is_available: true },
        });
        const byDay = new Map<number, Array<{ start: string; end: string }>>();
        for (const a of availabilities) {
          const list = byDay.get(a.day_of_week) ?? [];
          list.push({ start: a.start_time, end: a.end_time });
          byDay.set(a.day_of_week, list);
        }
        for (const o of occurrences) {
          const windows = byDay.get(o.day_of_week);
          if (!windows || windows.length === 0) {
            conflicts.push({
              type: 'teacher',
              message: `Teacher ${teacherName} has no availability on ${humanDate(o.date)} (${dayLabel(o.day_of_week)}).`,
              date: o.date,
              start_time: o.start_time,
              end_time: o.end_time,
              person: teacherName,
            });
            continue;
          }
          const oStart = toMinutes(o.start_time);
          const oEnd = toMinutes(o.end_time);
          const covered = windows.some((w) => {
            const ws = toMinutes(w.start);
            const we = toMinutes(w.end);
            return !Number.isNaN(ws) && !Number.isNaN(we) && oStart >= ws && oEnd <= we;
          });
          if (!covered) {
            conflicts.push({
              type: 'teacher',
              message: `Teacher ${teacherName} is not available during ${shortTime(o.start_time)}–${shortTime(o.end_time)} on ${humanDate(o.date)}.`,
              date: o.date,
              start_time: o.start_time,
              end_time: o.end_time,
              person: teacherName,
            });
          }
        }
      }
    } catch (err: any) {
      // Availability is advisory: never block activation on a lookup failure.
      this.logger?.warn?.(`Teacher availability check skipped: ${err?.message ?? err}`);
    }

    // ── Q4: Room capacity ─────────────────────────────────────────────
    // For in-person groups, the enrolled student count must not exceed
    // the classroom's capacity. Skipped for online/hybrid or room-less windows.
    if (group.mode === GroupMode.IN_PERSON) {
      try {
        const activeCount = await em
          .getRepository(GroupStudent)
          .createQueryBuilder('gs')
          .where('gs.group_id = :gid', { gid: group.id })
          .andWhere("LOWER(CAST(gs.status AS TEXT)) = 'active'")
          .getCount();
        const roomIds = [...new Set(occurrences.map((o) => o.classroom_id).filter((r): r is string => Boolean(r)))];
        if (roomIds.length > 0) {
          const rooms = await em.getRepository(Classroom).findByIds(roomIds);
          const roomById = new Map<string, { capacity: number; name: string }>();
          for (const r of rooms) roomById.set(r.id, { capacity: r.capacity, name: r.name });
          for (const o of occurrences) {
            if (!o.classroom_id) continue;
            const room = roomById.get(o.classroom_id);
            if (!room) continue;
            if (activeCount > room.capacity) {
              conflicts.push({
                type: 'classroom',
                message: `Room "${room.name}" capacity (${room.capacity}) is below the group's enrolled student count (${activeCount}) for in-person session on ${humanDate(o.date)}.`,
                date: o.date,
                start_time: o.start_time,
                end_time: o.end_time,
                room: o.classroom_id,
              });
            }
          }
        }
      } catch (err: any) {
        this.logger?.warn?.(`Room capacity check skipped: ${err?.message ?? err}`);
      }
    }

    // De-duplicate identical messages (an occurrence may clash on several sessions).
    const seen = new Set<string>();
    return conflicts.filter((c) => (seen.has(c.message) ? false : (seen.add(c.message), true)));
  }

  // ─── Row building ─────────────────────────────────────────────

  /** Map an occurrence to a Session row using the group's fixed settings. */
  private buildSessionRow(group: Group, o: Occurrence): Partial<Session> {
    return {
      group_id: group.id,
      // TypeORM serializes a 'YYYY-MM-DD' string into the DATE column.
      date: o.date as unknown as Date,
      start_time: o.start_time,
      end_time: o.end_time,
      classroom_id: o.classroom_id ?? null,
      mode: group.mode,
      // One fixed meeting URL per Group: every generated session resolves to
      // the group's link (kept on the session row so existing readers work).
      zoom_meeting_id: group.zoom_meeting_id ?? null,
      zoom_join_url: group.zoom_link ?? null,
      onmeet_meeting_id: group.onmeet_meeting_id ?? null,
      topic: group.name,
    };
  }

  /**
   * Insert occurrences with ON CONFLICT DO NOTHING against the partial
   * unique index — repeated/concurrent activations never duplicate rows.
   * Returns the number of sessions actually created.
   */
  private async insertOccurrences(em: EntityManager, group: Group, occurrences: Occurrence[]): Promise<number> {
    if (occurrences.length === 0) return 0;
    const repo = em.getRepository(Session);
    let created = 0;
    for (const o of occurrences) {
      const row = this.buildSessionRow(group, o);
      const result = await repo
        .createQueryBuilder()
        .insert()
        .into(Session)
        .values(row as Partial<Session>)
        .orIgnore() // ON CONFLICT DO NOTHING (partial unique index)
        .execute();
      created += result.identifiers?.length ?? 0;
    }
    return created;
  }

  // ─── Public API ───────────────────────────────────────────────

  /**
   * Validate + generate + activate in ONE transaction:
   *  1. lock the group row (serializes concurrent activations);
   *  2. validate schedule config, meeting URL, and teacher/room conflicts;
   *  3. insert all missing occurrences idempotently;
   *  4. flip status to ACTIVE.
   * Safe to retry: an already-active group regenerates nothing twice.
   */
  async activate(groupId: string, user?: AuthUser): Promise<ActivationResult> {
    return this.dataSource.transaction(async (em) => {
      // Row lock first (TypeORM cannot combine lock + relations in findOne):
      // serializes concurrent activations of the same group.
      await em.query(`SELECT id FROM groups WHERE id = $1 FOR UPDATE`, [groupId]);
      const group = await em.getRepository(Group).findOne({
        where: { id: groupId },
        relations: ['schedules', 'teacher'],
      });
      if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);
      if (user) assertBranchAccess(user, group.branch_id);

      const alreadyActive = group.status === GroupStatus.ACTIVE;
      const windows: ScheduleWindow[] = (group.schedules ?? [])
        .filter((s) => s.is_recurring !== false)
        .map((s) => ({
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
          classroom_id: s.classroom_id,
        }));

      // ── 8-week generation horizon (Q2) ──────────────────────────────
      // Generate only the next 8 weeks of occurrences. Start from the
      // group's start_date if it is in the future, otherwise from today.
      // Cap the end date at today + 8 weeks so repeated activations
      // progressively fill the horizon as time advances.
      const today = academyToday(this.config);
      const groupStart = dateStr(group.start_date);
      const groupEnd = dateStr(group.end_date);
      const startDate = groupStart >= today ? groupStart : today;
      const horizonEnd = addWeeks(today, HORIZON_WEEKS);
      const endDate = groupEnd > horizonEnd ? horizonEnd : groupEnd;

      const configErrors = validateScheduleConfig(windows, startDate, endDate);
      if (configErrors.length > 0) {
        throw new BadRequestException({
          message: 'Group activation failed: invalid recurring schedule',
          errors: configErrors,
        });
      }
      this.assertWindowsDisjoint(windows);
      this.validateMeetingUrl(group);

      const occurrences = expandOccurrences(windows, startDate, endDate);

      // Cross-group safety: the group ROW lock above only serializes writers
      // of THIS group. Advisory locks on the teacher and every room involved
      // make concurrent activations/edits touching the same teacher or room
      // wait, so the conflict check below can never race a competing insert.
      await acquireSchedulingLocks(em, [
        { kind: 'teacher', id: group.teacher_id },
        ...windows.map((w) => ({ kind: 'room' as const, id: w.classroom_id ?? '' })),
      ]);

      const conflicts = await this.findConflicts(em, group, occurrences);
      if (conflicts.length > 0) {
        throw new ConflictException({
          message: `Group activation failed: ${conflicts.length} scheduling conflict${conflicts.length > 1 ? 's' : ''} detected`,
          conflicts,
        });
      }

      const generated = await this.insertOccurrences(em, group, occurrences);

      if (!alreadyActive) {
        group.status = GroupStatus.ACTIVE;
        await em.getRepository(Group).save(group);
      }

      return {
        group_id: group.id,
        status: GroupStatus.ACTIVE,
        already_active: alreadyActive,
        total_occurrences: occurrences.length,
        generated,
        from: occurrences[0]?.date,
        to: occurrences[occurrences.length - 1]?.date,
      };
    });
  }

  /**
   * Update the recurring schedule starting from an effective date:
   *  - replace the group's weekly windows (group_schedules rows);
   *  - sessions BEFORE the effective date are never touched;
   *  - future sessions WITH attendance / lock / cancellation are PRESERVED
   *    (historical records are never destroyed) and reported back;
   *  - other future sessions are deleted and regenerated from the new
   *    windows, idempotently (ON CONFLICT DO NOTHING).
   * All inside one transaction with the group row locked.
   */
  async reschedule(
    groupId: string,
    dto: { effective_date: string; windows: Array<{ day_of_week: number; start_time: string; end_time: string; classroom_id?: string | null }> },
    user?: AuthUser,
  ): Promise<RescheduleResult> {
    const effectiveDate = dateStr(dto.effective_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) {
      throw new BadRequestException({
        message: 'Invalid reschedule request',
        errors: ['effective_date is required (YYYY-MM-DD).'],
      });
    }

    return this.dataSource.transaction(async (em) => {
      await em.query(`SELECT id FROM groups WHERE id = $1 FOR UPDATE`, [groupId]);
      const group = await em.getRepository(Group).findOne({
        where: { id: groupId },
        relations: ['schedules', 'teacher'],
      });
      if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);
      if (user) assertBranchAccess(user, group.branch_id);

      const startDate = dateStr(group.start_date);
      const endDate = dateStr(group.end_date);
      if (effectiveDate > endDate) {
        throw new BadRequestException({
          message: 'Invalid reschedule request',
          errors: [`Effective date (${effectiveDate}) is after the group's end date (${endDate}).`],
        });
      }

      const windows: ScheduleWindow[] = dto.windows.map((w) => ({
        day_of_week: w.day_of_week,
        start_time: normalizeTime(w.start_time) ?? w.start_time,
        end_time: normalizeTime(w.end_time) ?? w.end_time,
        classroom_id: w.classroom_id ?? null,
      }));

      const configErrors = validateScheduleConfig(windows, startDate, endDate);
      if (configErrors.length > 0) {
        throw new BadRequestException({
          message: 'Reschedule failed: invalid recurring schedule',
          errors: configErrors,
        });
      }
      this.assertWindowsDisjoint(windows);
      this.validateMeetingUrl(group);

      // Same cross-group safety as activate(): serialize with any concurrent
      // activation/reschedule/edit touching this teacher or these rooms.
      await acquireSchedulingLocks(em, [
        { kind: 'teacher', id: group.teacher_id },
        ...windows.map((w) => ({ kind: 'room' as const, id: w.classroom_id ?? '' })),
      ]);

      // Future occurrences under the NEW windows (from the effective date).
      const futureOccurrences = expandOccurrences(windows, effectiveDate, endDate);

      // Existing future sessions of this group.
      const sessionRepo = em.getRepository(Session);
      const futureSessions = await sessionRepo
        .createQueryBuilder('s')
        .where('s.group_id = :groupId', { groupId })
        .andWhere('s.date >= :eff', { eff: effectiveDate })
        .getMany();

      // Attendance-bearing sessions: never delete.
      const withAttendance = new Set<string>();
      if (futureSessions.length > 0) {
        const rows: { session_id: string }[] = await em.query(
          `SELECT DISTINCT session_id FROM attendances WHERE session_id = ANY($1::uuid[])`,
          [futureSessions.map((s) => s.id)],
        );
        for (const r of rows) withAttendance.add(r.session_id);
      }

      const deletable: string[] = [];
      const preserved: RescheduleResult['preserved'] = [];
      for (const s of futureSessions) {
        const date = dateStr(s.date);
        if (s.cancelled_at) {
          preserved.push({ session_id: s.id, date, reason: 'cancelled' });
        } else if (s.attendance_locked) {
          preserved.push({ session_id: s.id, date, reason: 'attendance_locked' });
        } else if (withAttendance.has(s.id)) {
          preserved.push({ session_id: s.id, date, reason: 'attendance' });
        } else {
          deletable.push(s.id);
        }
      }

      // Conflicts of the NEW schedule against real bookings. The sessions we
      // are about to delete are excluded so they don't flag against
      // themselves, and occurrences matching preserved sessions are dropped
      // BEFORE validation (those slots stay occupied by history).
      const preservedKeys = new Set(
        futureSessions
          .filter((s) => !deletable.includes(s.id))
          .map((s) => `${dateStr(s.date)}|${String(s.start_time).slice(0, 5)}`),
      );
      const toInsert = futureOccurrences.filter(
        (o) => !preservedKeys.has(`${o.date}|${o.start_time.slice(0, 5)}`),
      );
      const conflicts = await this.findConflicts(em, group, toInsert, {
        skipSessionIds: new Set(deletable),
      });
      if (conflicts.length > 0) {
        throw new ConflictException({
          message: `Reschedule failed: ${conflicts.length} scheduling conflict${conflicts.length > 1 ? 's' : ''} detected`,
          conflicts,
        });
      }

      // Replace the weekly windows (single source of truth).
      await em.getRepository(GroupSchedule).delete({ group_id: groupId });
      for (const w of windows) {
        await em.getRepository(GroupSchedule).save(
          em.getRepository(GroupSchedule).create({
            group_id: groupId,
            day_of_week: w.day_of_week,
            start_time: w.start_time,
            end_time: w.end_time,
            classroom_id: w.classroom_id ?? null,
          }),
        );
      }

      // Remove only unprotected future sessions, then regenerate.
      if (deletable.length > 0) {
        await sessionRepo.delete({ id: In(deletable) });
      }
      const created = await this.insertOccurrences(em, group, toInsert);

      return {
        group_id: groupId,
        effective_date: effectiveDate,
        total_occurrences: futureOccurrences.length,
        created,
        deleted: deletable.length,
        preserved,
      };
    });
  }

  /**
   * Dry-run validation of the group's current schedule — used by the staff
   * UI to preview occurrences and conflicts BEFORE attempting activation.
   * Writes nothing.
   */
  async validate(groupId: string): Promise<{
    valid: boolean;
    occurrences: number;
    preview: Array<{ date: string; start_time: string; end_time: string }>;
    conflicts: ScheduleConflict[];
    errors: string[];
  }> {
    const group = await this.groups.findOne({ where: { id: groupId }, relations: ['schedules', 'teacher'] });
    if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);

    const windows: ScheduleWindow[] = (group.schedules ?? [])
      .filter((s) => s.is_recurring !== false)
      .map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        classroom_id: s.classroom_id,
      }));

    const startDate = dateStr(group.start_date);
    const endDate = dateStr(group.end_date);
    const errors = validateScheduleConfig(windows, startDate, endDate);
    if (errors.length > 0) {
      return { valid: false, occurrences: 0, preview: [], conflicts: [], errors };
    }

    const occurrences = expandOccurrences(windows, startDate, endDate);
    let conflicts: ScheduleConflict[] = [];
    try {
      this.validateMeetingUrl(group);
      conflicts = await this.findConflicts(this.dataSource.manager, group, occurrences);
    } catch (err: any) {
      const body = err?.response;
      if (Array.isArray(body?.errors)) errors.push(...body.errors);
      else errors.push(err?.message ?? 'Validation failed');
    }

    return {
      valid: errors.length === 0 && conflicts.length === 0,
      occurrences: occurrences.length,
      preview: occurrences.map((o) => ({ date: o.date, start_time: o.start_time, end_time: o.end_time })),
      conflicts,
      errors,
    };
  }
}





