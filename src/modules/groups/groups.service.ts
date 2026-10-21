import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Group } from '../../shared/entities/group.entity';
import { GroupSchedule } from '../../shared/entities/group-schedule.entity';
import { User } from '../../shared/entities/user.entity';
import { Student } from '../../shared/entities/student.entity';
import { GroupMode } from '../../common/enums/group-mode.enum';
import { GroupStatus } from '../../common/enums/group-status.enum';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { AuthUser } from '../../common/utils/auth-user';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { ChatService } from '../chat/chat.service';

/** Minimal schedule window used by the conflict engine. */
interface ScheduleWindow {
  day_of_week: number;
  start_time: string;
  end_time: string;
  classroom_id?: string | null;
}

/** 'HH:MM[:SS]' → minutes since midnight (NaN-safe). */
function toMinutes(time?: string | null): number {
  if (!time) return NaN;
  const m = /^(\d{1,2}):(\d{2})/.exec(String(time));
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Sunday-first day label (matches the admin UI's daysOfWeek array). */
function dayLabel(day: number): string {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return names[Number(day)] ?? `day ${day}`;
}

/** Half-open overlap: [aStart, aEnd) ∩ [bStart, bEnd) ≠ ∅ on the same day. */
function windowsOverlap(a: ScheduleWindow, b: ScheduleWindow): boolean {
  if (Number(a.day_of_week) !== Number(b.day_of_week)) return false;
  const aS = toMinutes(a.start_time);
  const aE = toMinutes(a.end_time);
  const bS = toMinutes(b.start_time);
  const bE = toMinutes(b.end_time);
  if ([aS, aE, bS, bE].some(Number.isNaN)) return false;
  return aS < bE && bS < aE;
}

@Injectable()
export class GroupsService {
  private readonly logger = new Logger(GroupsService.name);

  constructor(
    @InjectRepository(Group)
    private readonly repo: Repository<Group>,
    @InjectRepository(GroupSchedule)
    private readonly scheduleRepo: Repository<GroupSchedule>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    private readonly enrollmentsService: EnrollmentsService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Automatic group chat rooms: whenever a study Group exists, its chat
   * room is created (if missing) and its membership is synced with the
   * group's teacher, substitute teacher, and active students. Chat
   * failures are logged but never break group management operations.
   */
  private async syncChatRoomSafely(groupId: string): Promise<void> {
    try {
      await this.chatService.syncGroupChatRoom(groupId);
    } catch (err: any) {
      this.logger.warn(`Chat room sync failed for group ${groupId}: ${err?.message ?? err}`);
    }
  }

  async create(dto: CreateGroupDto): Promise<Group> {
    const entityData: Partial<Group> = {
      name: dto.name,
      course_id: dto.courseId,
      teacher_id: dto.teacherId,
      substitute_teacher_id: dto.substitute_teacher_id || null,
      capacity: dto.capacity,
      mode: dto.mode ? (dto.mode as GroupMode) : GroupMode.IN_PERSON,
      start_date: new Date(dto.start_date),
      end_date: new Date(dto.end_date),
      status: dto.status ? (dto.status as GroupStatus) : GroupStatus.UPCOMING,
    };

    const group = this.repo.create(entityData);
    const saved = await this.repo.save(group);
    await this.syncChatRoomSafely(saved.id);
    return saved;
  }

  async findAll(filters: { courseId?: string }): Promise<Group[]> {
    const query = this.repo.createQueryBuilder('group')
      .leftJoinAndSelect('group.course', 'course')
      .leftJoinAndSelect('group.teacher', 'teacher')
      .leftJoinAndSelect('group.substitute_teacher', 'substituteTeacher');

    if (filters.courseId) {
      query.andWhere('course.id = :courseId', { courseId: filters.courseId });
    }

    const groups = await query.getMany();
    const counts = await this.countActiveMembers(groups.map((g) => g.id));
    return groups.map((g) => ({
      ...g,
      student_count: counts.get(g.id) ?? 0,
    }));
  }

  async findOne(id: string): Promise<Group & { students: Student[]; schedule: GroupSchedule[]; student_count: number }> {
    const group = await this.repo.findOne({
      where: { id },
      relations: ['course', 'teacher', 'substitute_teacher', 'schedules'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    // Roster (Business Rule 3 — admin visibility): students backed by EITHER
    // the group_students table (legacy/manual) or an ACTIVE enrollment (the
    // LMS source of truth). Also exposes `schedule`, the alias the admin UI
    // renders (entity field is `schedules`).
    const students = await this.loadRoster(id);

    return {
      ...group,
      students,
      schedule: group.schedules ?? [],
      student_count: students.length,
    };
  }

  /** Active roster ids: group_students ∪ ACTIVE enrollments (deduplicated). */
  private async activeRosterIds(groupId: string): Promise<string[]> {
    const rows: { student_id: string }[] = await this.repo.query(
      `SELECT student_id FROM group_students WHERE group_id = $1 AND status = 'active'
       UNION
       SELECT student_id FROM enrollments WHERE group_id = $2 AND LOWER(CAST(status AS TEXT)) = 'active'`,
      [groupId, groupId],
    );
    return rows.map((r) => r.student_id);
  }

  /** Roster students (with user contact) for a group, alphabetically. */
  private async loadRoster(groupId: string): Promise<Student[]> {
    const ids = await this.activeRosterIds(groupId);
    if (ids.length === 0) return [];
    return this.studentRepo.find({
      where: { id: In(ids) },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });
  }

  /** Per-group ACTIVE member counts for the list view (single round-trip). */
  private async countActiveMembers(groupIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (groupIds.length === 0) return counts;
    const rows: { group_id: string; count: string }[] = await this.repo.query(
      `SELECT group_id, COUNT(*) AS count FROM (
         SELECT group_id, student_id FROM group_students WHERE status = 'active' AND group_id = ANY($1::uuid[])
         UNION
         SELECT group_id, student_id FROM enrollments
           WHERE LOWER(CAST(status AS TEXT)) = 'active' AND group_id = ANY($1::uuid[])
       ) members GROUP BY group_id`,
      [groupIds],
    );
    for (const r of rows) counts.set(r.group_id, parseInt(r.count, 10));
    return counts;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);

    if (dto.name !== undefined) group.name = dto.name;
    if (dto.courseId !== undefined) group.course_id = dto.courseId;
    if (dto.teacherId !== undefined) group.teacher_id = dto.teacherId;
    if (dto.substitute_teacher_id !== undefined) group.substitute_teacher_id = dto.substitute_teacher_id || null;
    if (dto.capacity !== undefined) group.capacity = dto.capacity;
    if (dto.mode !== undefined) group.mode = dto.mode as GroupMode;
    if (dto.start_date !== undefined) group.start_date = new Date(dto.start_date);
    if (dto.end_date !== undefined) group.end_date = new Date(dto.end_date);
    if (dto.status !== undefined) group.status = dto.status as GroupStatus;

    const saved = await this.repo.save(group);
    await this.syncChatRoomSafely(saved.id); // picks up teacher/substitute changes
    return saved;
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.repo.remove(group);
  }

  /**
   * Real scheduling conflict engine (teacher + room).
   *
   * Flags a detail line when any window of the requesting group overlaps
   * (same weekday + intersecting time range):
   *  - a group already taught by the candidate teacher  → "Schedule conflict"
   *  - any group already using one of the window's classrooms → "Room conflict"
   * The requesting group itself is excluded; completed/cancelled groups are
   * ignored.
   */
  private async findScheduleConflicts(opts: {
    teacherId?: string;
    classroomIds?: string[];
    windows: ScheduleWindow[];
    excludeGroupId?: string;
  }): Promise<string[]> {
    const details: string[] = [];
    if (!opts.windows.length) return details;

    const NIL = '00000000-0000-0000-0000-000000000000';
    const LIVE = [GroupStatus.UPCOMING, GroupStatus.ACTIVE];

    // ── Teacher schedule conflicts ──
    if (opts.teacherId) {
      const others = await this.repo
        .createQueryBuilder('g')
        .leftJoinAndSelect('g.schedules', 's')
        .where('g.id != :exclude', { exclude: opts.excludeGroupId ?? NIL })
        .andWhere('g.teacher_id = :tid', { tid: opts.teacherId })
        .andWhere('g.status IN (:...live)', { live: LIVE })
        .getMany();
      for (const other of others) {
        for (const w of opts.windows) {
          for (const o of other.schedules ?? []) {
            if (windowsOverlap(w, o)) {
              details.push(
                `Schedule conflict: "${other.name}" already meets on ${dayLabel(o.day_of_week)} ${o.start_time}–${o.end_time}`,
              );
            }
          }
        }
      }
    }

    // ── Room (classroom) conflicts — any group, any teacher ──
    const rooms = [...new Set(opts.windows.map((w) => w.classroom_id).filter((v): v is string => Boolean(v)))];
    if (rooms.length) {
      const others = await this.repo
        .createQueryBuilder('g')
        .leftJoinAndSelect('g.schedules', 's')
        .where('g.id != :exclude', { exclude: opts.excludeGroupId ?? NIL })
        .andWhere('s.classroom_id IN (:...rooms)', { rooms })
        .andWhere('g.status IN (:...live)', { live: LIVE })
        .getMany();
      for (const other of others) {
        for (const w of opts.windows) {
          for (const o of other.schedules ?? []) {
            if (
              o.classroom_id &&
              w.classroom_id &&
              String(o.classroom_id) === String(w.classroom_id) &&
              windowsOverlap(w, o)
            ) {
              details.push(
                `Room conflict: "${other.name}" already uses this classroom on ${dayLabel(o.day_of_week)} ${o.start_time}–${o.end_time}`,
              );
            }
          }
        }
      }
    }

    return [...new Set(details)];
  }

  /**
   * GET /groups/check-conflicts — public shape kept ({conflicts, details}).
   * Time-overlap checks run only when an explicit weekday + HH:MM window is
   * provided; legacy date-range callers keep their previous (vacuous) result.
   */
  async checkConflicts(filters: {
    teacherId?: string;
    classroomId?: string;
    startTime?: string;
    endTime?: string;
    excludeGroupId?: string;
    dayOfWeek?: number;
  }): Promise<{ conflicts: boolean; details: string[] }> {
    const bareTime = (t?: string) => /^\d{1,2}:\d{2}/.test(String(t ?? ''));
    if (
      filters.dayOfWeek === undefined ||
      filters.dayOfWeek === null ||
      !bareTime(filters.startTime) ||
      !bareTime(filters.endTime)
    ) {
      return { conflicts: false, details: [] };
    }

    const windows: ScheduleWindow[] = [
      {
        day_of_week: Number(filters.dayOfWeek),
        start_time: filters.startTime as string,
        end_time: filters.endTime as string,
        classroom_id: filters.classroomId ?? null,
      },
    ];
    const details = await this.findScheduleConflicts({
      teacherId: filters.teacherId,
      classroomIds: filters.classroomId ? [filters.classroomId] : [],
      windows,
      excludeGroupId: filters.excludeGroupId,
    });
    return { conflicts: details.length > 0, details };
  }

  async getCalendar(filters: {
    view: 'day' | 'week' | 'month';
    date: string;
    teacherId?: string;
    classroomId?: string;
  }): Promise<Group[]> {
    const query = this.repo.createQueryBuilder('group')
      .leftJoinAndSelect('group.course', 'course')
      .leftJoinAndSelect('group.teacher', 'teacher');

    if (filters.teacherId) {
      query.andWhere('group.teacher_id = :teacherId', { teacherId: filters.teacherId });
    }

    return query.getMany();
  }

  /**
   * Business Rule 1 — direct teacher assignment. Staff may replace a group's
   * instructor at any time; schedule/room conflicts are detected first and
   * rejected with 409 (details in the message) unless `force` is set.
   */
  async assignTeacher(groupId: string, dto: AssignTeacherDto, _user: AuthUser) {
    const group = await this.findOne(groupId);

    const teacher = await this.userRepo.findOne({ where: { id: dto.teacher_id } });
    if (!teacher) throw new NotFoundException('Teacher not found');
    if (String(teacher.status).toLowerCase() !== 'active') {
      throw new BadRequestException('Teacher account is not active');
    }

    const windows: ScheduleWindow[] = (group.schedules ?? []).map((s) => ({
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      classroom_id: s.classroom_id,
    }));

    const conflicts = await this.findScheduleConflicts({
      teacherId: teacher.id,
      windows,
      excludeGroupId: group.id,
    });

    if (conflicts.length > 0 && !dto.force) {
      throw new ConflictException({
        message: `Assignment conflicts detected: ${conflicts.join(' | ')}`,
        details: conflicts,
      });
    }

    group.teacher_id = teacher.id;
    await this.repo.save(group);
    await this.syncChatRoomSafely(group.id); // re-seat the new teacher in the room

    return { ...group, conflicts, overridden: conflicts.length > 0 };
  }

  async addSchedule(groupId: string, schedule: any): Promise<GroupSchedule> {
    const group = await this.findOne(groupId);
    const newSchedule = this.scheduleRepo.create({
      group_id: groupId,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      classroom_id: schedule.classroom_id || null,
    });
    return this.scheduleRepo.save(newSchedule);
  }

  async removeSchedule(groupId: string, scheduleId: string): Promise<void> {
    const schedule = await this.scheduleRepo.findOne({ where: { id: scheduleId, group_id: groupId } });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found in group ${groupId}`);
    }
    await this.scheduleRepo.remove(schedule);
  }

  /**
   * Business Rule 2 — direct manual enrollment. Creates/updates the ACTIVE
   * enrollment (level gate, invoice, chat sync via EnrollmentsService) AND
   * the group_students roster row used by attendance/chat.
   *
   *  - Capacity full        → 409 unless `force` (admin bypass).
   *  - Existing PENDING     → finalized through the approval flow (invoice).
   *  - Existing ACTIVE      → idempotent: roster reconciled, no duplicate.
   *  - `course_id` (optional) must match the group's course.
   */
  async addStudent(groupId: string, dto: AddStudentDto, user: AuthUser) {
    const group = await this.findOne(groupId);

    if (dto.course_id && dto.course_id !== group.course_id) {
      throw new BadRequestException('Selected course does not match this group');
    }

    // Reconcile with an existing PENDING/ACTIVE enrollment (unique on
    // (group_id, student_id) — never insert a duplicate row).
    const existing = await this.enrollmentsService.findExisting(dto.student_id, group.id);
    if (existing && String(existing.status).toLowerCase() === 'active') {
      await this.syncRosterRow(group.id, dto.student_id);
      await this.syncChatRoomSafely(group.id);
      return { enrollment: existing, roster_status: 'active', already_enrolled: true };
    }
    if (existing) {
      // PENDING request awaiting approval → finalize it the standard way
      // (capacity re-check + invoice + chat sync inside approve()).
      const approved = await this.enrollmentsService.approve(existing.id, user);
      await this.syncRosterRow(group.id, dto.student_id);
      return { enrollment: approved, roster_status: 'active', approved_pending: true };
    }

    const activeCount = await this.enrollmentsService.countActive(group.id);
    if (activeCount >= group.capacity && !dto.force) {
      throw new ConflictException(
        `Group is full (capacity ${group.capacity}, ${activeCount} enrolled) — re-submit with force to add anyway`,
      );
    }

    const enrollment = await this.enrollmentsService.create(
      { student_id: dto.student_id, group_id: group.id },
      user,
      { skipCapacityCheck: Boolean(dto.force) },
    );

    await this.syncRosterRow(group.id, dto.student_id);
    return { enrollment, roster_status: 'active', already_enrolled: false };
  }

  /** Upsert the roster row (attendance/chat read group_students). */
  private async syncRosterRow(groupId: string, studentId: string): Promise<void> {
    await this.repo.query(
      `INSERT INTO group_students (group_id, student_id, status, enrolled_at)
       VALUES ($1, $2, 'active', NOW())
       ON CONFLICT (group_id, student_id) DO UPDATE SET status = 'active'`,
      [groupId, studentId],
    );
  }

  async removeStudent(groupId: string, studentId: string): Promise<void> {
    const result = await this.repo.query(
      `DELETE FROM group_students WHERE group_id = $1 AND student_id = $2 RETURNING id`,
      [groupId, studentId]
    );
    if (!result || result.length === 0) {
      throw new NotFoundException(`Student ${studentId} not found in group ${groupId}`);
    }
    await this.syncChatRoomSafely(groupId);
  }
}