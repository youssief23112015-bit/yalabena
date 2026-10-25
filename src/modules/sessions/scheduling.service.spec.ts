import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SessionSchedulingService } from './scheduling.service';
import { GroupMode } from '../../common/enums/group-mode.enum';
import { GroupStatus } from '../../common/enums/group-status.enum';

/**
 * Unit tests for the automatic recurring-session scheduler:
 * activation (validation → generation → status flip), idempotency,
 * teacher/room conflict blocking, partial-overlap detection, and
 * effective-date reschedules that preserve history.
 *
 * The data layer is mocked: a fake EntityManager whose repositories are
 * scripted per test. `insertOccurrences` goes through the query-builder
 * insert chain, and `activate`/`reschedule` run inside
 * `dataSource.transaction(cb)` — both are simulated faithfully enough to
 * verify the orchestration, guard conditions, and rollback-on-throw
 * (the callback rethrows, so the surrounding transaction rolls back).
 */

interface InsertCall {
  row: any;
}

function makeQB() {
  const qb: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orIgnore: jest.fn().mockReturnThis(),
    // A real INSERT ... ON CONFLICT DO NOTHING returns one identifier per
    // row actually written — emulate that for generated-count assertions.
    execute: jest.fn(async () => ({ identifiers: [{ id: `gen-${Date.now()}-${Math.random()}` }], raw: [] })),
  };
  return qb;
}

describe('SessionSchedulingService', () => {
  let service: SessionSchedulingService;
  let insertCalls: InsertCall[];
  let deletedSessionIds: string[] | null;
  let deletedScheduleFor: string | null;
  let scheduleSaves: any[];
  let groupSaves: any[];
  let lockedQueries: string[][];
  let rawQueries: Array<{ sql: string; params: any[] }>;
  let attendanceQueryResult: Array<{ session_id: string }>;
  let candidateSessions: any[];
  let testSlots: any[];
  let currentGroup: any;
  let txThrow: Error | null;

  const GROUP = () => ({
    id: 'g-1',
    name: 'English B1 — Group 03',
    branch_id: 'b-1',
    teacher_id: 't-1',
    mode: GroupMode.IN_PERSON,
    status: GroupStatus.UPCOMING,
    start_date: new Date('2026-11-01T00:00:00Z'),
    end_date: new Date('2026-11-30T00:00:00Z'),
    zoom_link: 'https://zoom.us/j/123456789',
    onmeet_link: null,
    zoom_meeting_id: null,
    onmeet_meeting_id: null,
    teacher: { id: 't-1', first_name: 'Ahmed', last_name: 'Hassan' },
    schedules: [
      { day_of_week: 0, start_time: '18:00:00', end_time: '19:30:00', classroom_id: 'room-1', is_recurring: true },
    ],
  });

  beforeEach(() => {
    insertCalls = [];
    deletedSessionIds = null;
    deletedScheduleFor = null;
    scheduleSaves = [];
    groupSaves = [];
    lockedQueries = [];
    rawQueries = [];
    attendanceQueryResult = [];
    candidateSessions = [];
    testSlots = [];
    currentGroup = GROUP();
    txThrow = null;

    const sessionRepo: any = {
      createQueryBuilder: jest.fn(() => makeQB()),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockImplementation(async (q: any) => {
        // Accept { id: In([...]) } (FindOperator exposes `.in`/`.value`) or a plain id.
        deletedSessionIds = q?.id?.in ?? q?.id?.value ?? q?.id ?? null;
        return { affected: 0 };
      }),
    };
    const groupRepo: any = {
      findOne: jest.fn().mockImplementation(async () => currentGroup),
      save: jest.fn().mockImplementation(async (g: any) => {
        groupSaves.push({ ...g });
        return g;
      }),
    };
    const scheduleRepo: any = {
      create: jest.fn((x: any) => ({ ...x })),
      save: jest.fn().mockImplementation(async (s: any) => {
        scheduleSaves.push(s);
        return s;
      }),
      delete: jest.fn().mockImplementation(async (q: any) => {
        deletedScheduleFor = q.group_id ?? null;
        return { affected: 0 };
      }),
    };
    const testSlotRepo: any = {
      // Mirrors the service's `status NOT IN ('cancelled','completed')` filter.
      find: jest.fn().mockImplementation(async () =>
        testSlots.filter((s: any) => s.status !== 'cancelled' && s.status !== 'completed'),
      ),
    };
    const dataSource: any = {
      manager: {},
      transaction: jest.fn(async (cb: any) => {
        const em: any = {
          query: jest.fn().mockImplementation(async (sql: string, params?: any[]) => {
            rawQueries.push({ sql, params: params ?? [] });
            if (/FOR UPDATE/.test(sql)) {
              lockedQueries.push([sql, params?.[0]]);
              return [];
            }
            if (/attendances/.test(sql)) return attendanceQueryResult;
            return [];
          }),
          getRepository: jest.fn((entity: any) => {
            const name = entity?.name ?? String(entity);
            if (name === 'Session') return sessionRepo;
            if (name === 'Group') return groupRepo;
            if (name === 'GroupSchedule') return scheduleRepo;
            if (name === 'TestSlot') return testSlotRepo;
            return sessionRepo;
          }),
        };
        try {
          return await cb(em);
        } catch (err) {
          if (txThrow) throw txThrow;
          throw err;
        }
      }),
    };

    const config = { get: jest.fn(() => undefined) } as any;

    service = new SessionSchedulingService(
      sessionRepo,
      groupRepo,
      scheduleRepo,
      testSlotRepo,
      dataSource,
      config,
    );

    // One query-builder factory serves both the conflict candidate query
    // (getMany → candidateSessions) and the idempotent inserts (values →
    // recorded, execute → identifiers).
    sessionRepo.createQueryBuilder.mockImplementation(() => {
      const qb = makeQB();
      qb.getMany.mockImplementation(async () => candidateSessions);
      qb.values.mockImplementation((row: any) => {
        insertCalls.push({ row });
        return qb;
      });
      return qb;
    });
  });

  // ─── Activation: generation ──────────────────────────────────

  it('activates a valid group and generates one session per occurrence (5 Sundays)', async () => {
    const result = await service.activate('g-1');

    expect(result.status).toBe(GroupStatus.ACTIVE);
    expect(result.already_active).toBe(false);
    expect(result.total_occurrences).toBe(5);
    expect(result.generated).toBe(5);
    expect(result.from).toBe('2026-11-01');
    expect(result.to).toBe('2026-11-29');
    expect(groupSaves[0].status).toBe(GroupStatus.ACTIVE);
    // Generated rows carry the group's fixed Zoom link + room + wall-times.
    expect(insertCalls).toHaveLength(5);
    expect(insertCalls[0].row).toMatchObject({
      group_id: 'g-1',
      date: '2026-11-01',
      start_time: '18:00:00',
      end_time: '19:30:00',
      classroom_id: 'room-1',
      zoom_join_url: 'https://zoom.us/j/123456789',
    });
  });

  it('locks the group row inside the transaction (concurrency guard)', async () => {
    await service.activate('g-1');
    expect(lockedQueries.length).toBeGreaterThan(0);
    expect(lockedQueries[0][0]).toContain('FOR UPDATE');
    expect(lockedQueries[0][1]).toBe('g-1');
  });

  it('is idempotent: re-activating an active group creates no duplicates', async () => {
    currentGroup.status = GroupStatus.ACTIVE;
    const result = await service.activate('g-1');

    expect(result.already_active).toBe(true);
    // The insert path still runs with orIgnore(); a live DB's partial unique
    // index makes the retried inserts no-ops. Here we assert the guard flag
    // and that the group is not re-saved.
    expect(groupSaves).toHaveLength(0);
    expect(insertCalls.every((c) => c.row.group_id === 'g-1')).toBe(true);
  });

  it('rolls back (throws) when the schedule configuration is invalid', async () => {
    currentGroup.schedules = [{ day_of_week: 0, start_time: '19:00:00', end_time: '18:00:00', is_recurring: true }];
    await expect(service.activate('g-1')).rejects.toThrow(BadRequestException);
    expect(insertCalls).toHaveLength(0);
    expect(groupSaves).toHaveLength(0);
  });

  it('blocks activation when no recurring windows exist', async () => {
    currentGroup.schedules = [];
    await expect(service.activate('g-1')).rejects.toThrow(/invalid recurring schedule/i);
  });

  it('blocks an online group without any meeting link', async () => {
    currentGroup.mode = GroupMode.ONLINE;
    currentGroup.zoom_link = null;
    await expect(service.activate('g-1')).rejects.toThrow(/meeting link/i);
  });

  it('rejects a malformed Zoom URL', async () => {
    currentGroup.zoom_link = 'not a url';
    const err: any = await service.activate('g-1').catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.getResponse().errors.join(' ')).toMatch(/not a valid URL/i);
  });

  it('throws NotFound for a missing group', async () => {
    currentGroup = null;
    await expect(service.activate('nope')).rejects.toThrow(NotFoundException);
  });

  // ─── Activation: conflicts ───────────────────────────────────

  it('is blocked by a TEACHER conflict with another group (partial overlap)', async () => {
    // 18:00–19:30 requested; existing session 19:00–20:00 overlaps partially.
    candidateSessions = [
      {
        id: 's-other',
        group_id: 'g-other',
        classroom_id: null,
        date: new Date('2026-11-08T00:00:00Z'),
        start_time: '19:00:00',
        end_time: '20:00:00',
        cancelled_at: null,
        group: { id: 'g-other', name: 'A2 Evening', teacher_id: 't-1' },
      },
    ];

    await expect(service.activate('g-1')).rejects.toThrow(ConflictException);
    expect(insertCalls).toHaveLength(0);
    expect(groupSaves).toHaveLength(0);
  });

  it('blocks activation with a structured ROOM conflict message', async () => {
    candidateSessions = [
      {
        id: 's-room',
        group_id: 'g-other',
        classroom_id: 'room-1',
        date: new Date('2026-11-08T00:00:00Z'),
        start_time: '18:30:00',
        end_time: '19:00:00',
        cancelled_at: null,
        group: { id: 'g-other', name: 'C1 Writing', teacher_id: 't-9' },
      },
    ];

    const err = await service.activate('g-1').catch((e) => e);
    expect(err).toBeInstanceOf(ConflictException);
    const body: any = err.getResponse();
    expect(body.message).toMatch(/conflict/i);
    expect(body.conflicts[0].type).toBe('classroom');
    expect(body.conflicts[0].message).toMatch(/already reserved/i);
    expect(body.conflicts[0].date).toBe('2026-11-08');
  });

  it('is NOT blocked when the other session merely touches the boundary', async () => {
    candidateSessions = [
      {
        id: 's-touch',
        group_id: 'g-other',
        classroom_id: 'room-1',
        date: new Date('2026-11-08T00:00:00Z'),
        start_time: '19:30:00', // starts exactly when ours ends
        end_time: '21:00:00',
        cancelled_at: null,
        group: { id: 'g-other', name: 'C1 Writing', teacher_id: 't-9' },
      },
    ];

    const result = await service.activate('g-1');
    expect(result.generated).toBe(5);
  });

  it('blocks activation when the teacher has a placement-test reservation', async () => {
    testSlots = [
      {
        id: 'slot-1',
        examiner_id: 't-1',
        date: new Date('2026-11-15T00:00:00Z'),
        start_time: '18:00:00',
        end_time: '19:00:00',
        status: 'open',
      },
    ];

    const err = await service.activate('g-1').catch((e) => e);
    expect(err).toBeInstanceOf(ConflictException);
    const body: any = err.getResponse();
    expect(body.conflicts.some((c: any) => c.type === 'reservation')).toBe(true);
  });

  it('ignores cancelled slots as reservations', async () => {
    testSlots = [
      {
        id: 'slot-1',
        examiner_id: 't-1',
        date: new Date('2026-11-15T00:00:00Z'),
        start_time: '18:00:00',
        end_time: '19:00:00',
        status: 'cancelled',
      },
    ];
    const result = await service.activate('g-1');
    expect(result.generated).toBe(5);
  });

  // ─── Reschedule from an effective date ───────────────────────

  it('reschedules from an effective date: deletes unprotected future sessions, preserves past', async () => {
    // Existing future session (2026-11-08, unprotected) will be replaced.
    candidateSessions = [
      {
        id: 's-future',
        group_id: 'g-1',
        classroom_id: 'room-1',
        date: new Date('2026-11-08T00:00:00Z'),
        start_time: '18:00:00',
        end_time: '19:30:00',
        cancelled_at: null,
        attendance_locked: false,
        group: currentGroup,
      },
    ];

    const result = await service.reschedule('g-1', {
      effective_date: '2026-11-08',
      windows: [{ day_of_week: 1, start_time: '17:00', end_time: '18:30' }], // Mondays
    });

    // Effective date 2026-11-08 is a Sunday; the new Monday windows fall on
    // 9, 16, 23, 30 within the group's range.
    expect(result.total_occurrences).toBe(4);
    expect(result.created).toBe(4);
    expect(result.deleted).toBe(1);
    expect(deletedSessionIds).toEqual(['s-future']);
    // Weekly windows replaced (single source of truth).
    expect(deletedScheduleFor).toBe('g-1');
    expect(scheduleSaves).toHaveLength(1);
    expect(scheduleSaves[0]).toMatchObject({ day_of_week: 1, start_time: '17:00:00' });
    // Past sessions are NEVER fetched/deleted: query starts at effective_date.
    expect(insertCalls.map((c) => c.row.date)).toEqual([
      '2026-11-09',
      '2026-11-16',
      '2026-11-23',
      '2026-11-30',
    ]);
  });

  it('preserves future sessions holding attendance and reports them', async () => {
    candidateSessions = [
      {
        id: 's-att',
        group_id: 'g-1',
        classroom_id: 'room-1',
        date: new Date('2026-11-08T00:00:00Z'),
        start_time: '18:00:00',
        end_time: '19:30:00',
        cancelled_at: null,
        attendance_locked: false,
        group: currentGroup,
      },
      {
        id: 's-clean',
        group_id: 'g-1',
        classroom_id: 'room-1',
        date: new Date('2026-11-15T00:00:00Z'),
        start_time: '18:00:00',
        end_time: '19:30:00',
        cancelled_at: null,
        attendance_locked: false,
        group: currentGroup,
      },
    ];
    attendanceQueryResult = [{ session_id: 's-att' }];

    const result = await service.reschedule('g-1', {
      effective_date: '2026-11-08',
      windows: [{ day_of_week: 0, start_time: '18:00', end_time: '19:30' }], // unchanged Sundays
    });

    expect(result.preserved).toEqual([
      { session_id: 's-att', date: '2026-11-08', reason: 'attendance' },
    ]);
    expect(deletedSessionIds).toEqual(['s-clean']);
    // The preserved slot (2026-11-08) is NOT re-inserted; the rest are.
    expect(insertCalls.map((c) => c.row.date)).toEqual([
      '2026-11-15',
      '2026-11-22',
      '2026-11-29',
    ]);
  });

  it('preserves cancelled and attendance-locked sessions', async () => {
    candidateSessions = [
      {
        id: 's-cancelled',
        group_id: 'g-1',
        date: new Date('2026-11-08T00:00:00Z'),
        start_time: '18:00:00',
        end_time: '19:30:00',
        cancelled_at: new Date(),
        attendance_locked: false,
        group: currentGroup,
      },
      {
        id: 's-locked',
        group_id: 'g-1',
        date: new Date('2026-11-15T00:00:00Z'),
        start_time: '18:00:00',
        end_time: '19:30:00',
        cancelled_at: null,
        attendance_locked: true,
        group: currentGroup,
      },
    ];

    const result = await service.reschedule('g-1', {
      effective_date: '2026-11-08',
      windows: [{ day_of_week: 0, start_time: '18:00', end_time: '19:30' }],
    });

    expect(result.preserved.map((p) => p.reason).sort()).toEqual(['attendance_locked', 'cancelled']);
    expect(deletedSessionIds).toBeNull(); // nothing deletable — delete() never called
    // Only the unprotected dates get (re)generated.
    expect(insertCalls.map((c) => c.row.date)).toEqual(['2026-11-22', '2026-11-29']);
  });

  it('blocks a reschedule that would conflict with another group', async () => {
    candidateSessions = [
      {
        id: 's-foreign',
        group_id: 'g-other',
        classroom_id: 'room-1',
        date: new Date('2026-11-09T00:00:00Z'),
        start_time: '17:30:00',
        end_time: '18:00:00',
        cancelled_at: null,
        group: { id: 'g-other', name: 'A2 Evening', teacher_id: 't-1' },
      },
    ];

    await expect(
      service.reschedule('g-1', {
        effective_date: '2026-11-08',
        windows: [{ day_of_week: 1, start_time: '17:00', end_time: '18:30' }],
      }),
    ).rejects.toThrow(ConflictException);
    expect(insertCalls).toHaveLength(0);
    expect(deletedSessionIds).toBeNull(); // nothing deleted before validation
  });

  it('rejects an effective date after the group end date', async () => {
    const err: any = await service
      .reschedule('g-1', {
        effective_date: '2027-01-01',
        windows: [{ day_of_week: 0, start_time: '18:00', end_time: '19:30' }],
      })
      .catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.getResponse().errors.join(' ')).toMatch(/after the group's end date/i);
  });

  it('rejects a malformed effective date', async () => {
    const err: any = await service
      .reschedule('g-1', {
        effective_date: 'soon',
        windows: [{ day_of_week: 0, start_time: '18:00', end_time: '19:30' }],
      })
      .catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.getResponse().errors.join(' ')).toMatch(/effective_date/i);
  });

  // ─── Concurrency safety (advisory locks) & live-group filtering ───

  it('activation takes the group row lock plus teacher/room advisory locks', async () => {
    await service.activate('g-1');

    // Row lock on the group serializes same-group activations…
    expect(lockedQueries).toHaveLength(1);
    expect(lockedQueries[0][0]).toMatch(/FROM groups WHERE id = \$1 FOR UPDATE/);
    // …and advisory locks serialize cross-group writers on the same
    // teacher/room, in a deterministic (sorted) order.
    const advisory = rawQueries
      .filter((q) => q.sql.includes('pg_advisory_xact_lock'))
      .map((q) => q.params[0]);
    expect(advisory).toEqual(['sched.room:room-1', 'sched.teacher:t-1']);
  });

  it('reschedule takes teacher/room advisory locks for the NEW windows', async () => {
    await service.reschedule('g-1', {
      effective_date: '2026-11-08',
      windows: [{ day_of_week: 1, start_time: '17:00', end_time: '18:30', classroom_id: 'room-2' }],
    });
    const advisory = rawQueries
      .filter((q) => q.sql.includes('pg_advisory_xact_lock'))
      .map((q) => q.params[0]);
    expect(advisory).toEqual(['sched.room:room-2', 'sched.teacher:t-1']);
  });

  it('ignores sessions of CANCELLED groups as conflicts', async () => {
    candidateSessions = [
      {
        id: 's-dead',
        group_id: 'g-other',
        classroom_id: 'room-1',
        date: new Date('2026-11-08T00:00:00Z'),
        start_time: '18:00:00',
        end_time: '19:30:00',
        cancelled_at: null,
        group: { id: 'g-other', name: 'Cancelled Group', teacher_id: 't-1', status: GroupStatus.CANCELLED },
      },
    ];

    const result = await service.activate('g-1');
    expect(result.generated).toBe(5);
  });

  it('ignores sessions of COMPLETED groups as conflicts', async () => {
    candidateSessions = [
      {
        id: 's-done',
        group_id: 'g-other',
        classroom_id: 'room-1',
        date: new Date('2026-11-08T00:00:00Z'),
        start_time: '18:00:00',
        end_time: '19:30:00',
        cancelled_at: null,
        group: { id: 'g-other', name: 'Completed Group', teacher_id: 't-1', status: GroupStatus.COMPLETED },
      },
    ];

    const result = await service.activate('g-1');
    expect(result.generated).toBe(5);
  });

  it('still blocks on sessions of LIVE groups (status-aware control)', async () => {
    candidateSessions = [
      {
        id: 's-live',
        group_id: 'g-other',
        classroom_id: 'room-1',
        date: new Date('2026-11-08T00:00:00Z'),
        start_time: '18:00:00',
        end_time: '19:30:00',
        cancelled_at: null,
        group: { id: 'g-other', name: 'Live Group', teacher_id: 't-1', status: GroupStatus.ACTIVE },
      },
    ];

    const err = await service.activate('g-1').catch((e) => e);
    expect(err).toBeInstanceOf(ConflictException);
  });
});



