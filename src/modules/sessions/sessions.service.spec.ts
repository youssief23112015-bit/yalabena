import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionsService } from './sessions.service';
import { GroupMode } from '../../common/enums/group-mode.enum';

// ---------- repository mock helpers ----------

function makeQb(rows: any[] = []) {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
    getMany: jest.fn().mockResolvedValue(rows),
  };
  return qb;
}

function makeRepo() {
  return {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    create: jest.fn((p) => ({ ...p })),
    save: jest.fn(async (p) => ({ id: 'session-1', ...p })),
    remove: jest.fn(async () => undefined),
  } as any;
}

describe('SessionsService — conflict detection & group-link copy', () => {
  let service: SessionsService;
  let repo: ReturnType<typeof makeRepo>;
  let groupRepo: ReturnType<typeof makeRepo>;
  let dataSource: any;
  let txQueries: Array<{ sql: string; params: any[] }>;
  let txOpened: number;

  const GROUP = {
    id: 'g1',
    teacher_id: 't1',
    substitute_teacher_id: null,
    mode: GroupMode.IN_PERSON,
    zoom_link: null,
    zoom_meeting_id: null,
  };

  beforeEach(() => {
    repo = makeRepo();
    groupRepo = makeRepo();
    txQueries = [];
    txOpened = 0;
    // Emulates dataSource.transaction by running the callback against an
    // EntityManager whose repositories are the SAME mocks, so conflict
    // queries and writes keep flowing through the scripted jest mocks.
    dataSource = {
      transaction: jest.fn(async (cb: any) => {
        txOpened += 1;
        const em: any = {
          query: jest.fn(async (sql: string, params?: any[]) => {
            txQueries.push({ sql, params: params ?? [] });
            return [];
          }),
          getRepository: jest.fn((entity: any) =>
            entity?.name === 'Group' ? groupRepo : repo,
          ),
        };
        return cb(em);
      }),
    };
    service = new SessionsService(repo, groupRepo, new ConfigService({}), dataSource);
  });

  // ---------- detectConflicts ----------

  it('returns [] when date/start/end are missing', async () => {
    await expect(service.detectConflicts({ group_id: 'g1' })).resolves.toEqual([]);
  });

  it('detects group overlap on the same date/time window', async () => {
    repo.createQueryBuilder.mockReturnValueOnce(makeQb([{ id: 's-existing' }]));
    groupRepo.findOne.mockResolvedValue(GROUP);
    repo.createQueryBuilder.mockReturnValueOnce(makeQb([])); // teacher check

    const conflicts = await service.detectConflicts({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
    });

    expect(conflicts).toEqual([{ type: 'group', session_id: 's-existing' }]);
  });

  it('detects teacher overlap via group teacher_id', async () => {
    repo.createQueryBuilder
      .mockReturnValueOnce(makeQb([])) // group check
      .mockReturnValueOnce(makeQb([{ id: 's-teacher' }])); // teacher check
    groupRepo.findOne.mockResolvedValue(GROUP);

    const conflicts = await service.detectConflicts({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
    });

    expect(conflicts).toEqual([{ type: 'teacher', session_id: 's-teacher' }]);
  });

  it('detects classroom overlap', async () => {
    repo.createQueryBuilder.mockReturnValueOnce(makeQb([{ id: 's-room' }]));

    const conflicts = await service.detectConflicts({
      classroom_id: 'c1',
      date: '2026-10-01',
      start_time: '09:00:00',
      end_time: '10:00:00',
    });

    expect(conflicts).toEqual([{ type: 'classroom', session_id: 's-room' }]);
  });

  // ---------- create ----------

  it('create throws 409 with conflict details when overlap exists and force is not set', async () => {
    repo.createQueryBuilder.mockReturnValueOnce(makeQb([{ id: 's-x' }]));
    groupRepo.findOne.mockResolvedValue({ ...GROUP, mode: GroupMode.IN_PERSON });
    repo.createQueryBuilder.mockReturnValueOnce(makeQb([]));

    await expect(
      service.create({
        group_id: 'g1',
        date: '2026-10-01',
        start_time: '10:00:00',
        end_time: '11:00:00',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('create succeeds with force=true even when a conflict exists', async () => {
    repo.createQueryBuilder.mockReturnValueOnce(makeQb([{ id: 's-x' }]));
    groupRepo.findOne.mockResolvedValue({ ...GROUP, mode: GroupMode.IN_PERSON });
    repo.createQueryBuilder.mockReturnValueOnce(makeQb([]));

    const saved = await service.create({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
      force: true,
    });

    expect(saved.id).toBe('session-1');
    expect(repo.save).toHaveBeenCalled();
  });

  it('defaults mode from the group when not supplied', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb([]));
    groupRepo.findOne.mockResolvedValue({ ...GROUP, mode: GroupMode.IN_PERSON });

    await service.create({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ mode: GroupMode.IN_PERSON }),
    );
  });

  it('parses ISO datetimes into date + HH:mm:ss time fields', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb([]));
    groupRepo.findOne.mockResolvedValue({ ...GROUP, mode: GroupMode.IN_PERSON });

    await service.create({
      group_id: 'g1',
      start_time: '2026-10-01T10:30:00Z',
      end_time: '2026-10-01T12:00:00Z',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-10-01',
        start_time: '10:30:00',
        end_time: '12:00:00',
      }),
    );
  });

  // ---------- group link copy ----------

  it('copies group.zoom_link into session.zoom_join_url for online/hybrid sessions', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb([]));
    groupRepo.findOne.mockResolvedValue({
      ...GROUP,
      mode: GroupMode.ONLINE,
      zoom_link: 'https://zoom.us/j/group-link',
      zoom_meeting_id: 'zm-group-123',
    });

    await service.create({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        zoom_join_url: 'https://zoom.us/j/group-link',
        zoom_meeting_id: 'zm-group-123',
      }),
    );
  });

  it('does not set zoom_join_url when group has no zoom_link', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb([]));
    groupRepo.findOne.mockResolvedValue({
      ...GROUP,
      mode: GroupMode.ONLINE,
      zoom_link: null,
      zoom_meeting_id: null,
    });

    const saved = await service.create({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
    });

    expect(saved.id).toBe('session-1');
    expect(saved.zoom_join_url).toBeUndefined();
  });

  // ---------- update: single-session editing with conflict validation ----------

  const existingSession = () => ({
    id: 's-1',
    group_id: 'g1',
    classroom_id: 'c1',
    date: new Date('2026-10-01T00:00:00Z'),
    start_time: '10:00:00',
    end_time: '11:00:00',
    cancelled_at: null,
    attendance_locked: false,
    group: { ...GROUP },
  });

  it('update throws 409 when the new window overlaps another session (excluding itself)', async () => {
    repo.findOne.mockResolvedValue(existingSession());
    // Three overlap queries (group / teacher / classroom) all find clashes.
    repo.createQueryBuilder
      .mockReturnValueOnce(makeQb([{ id: 's-clash' }]))
      .mockReturnValueOnce(makeQb([{ id: 's-clash' }]))
      .mockReturnValueOnce(makeQb([{ id: 's-clash' }]));
    groupRepo.findOne.mockResolvedValue(GROUP);

    await expect(
      service.update('s-1', { date: '2026-10-01', start_time: '10:30:00', end_time: '11:30:00' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('update excludes the edited session itself from conflict checks', async () => {
    repo.findOne.mockResolvedValue(existingSession());
    const qb = makeQb([]);
    repo.createQueryBuilder.mockReturnValue(qb);
    groupRepo.findOne.mockResolvedValue(GROUP);

    // Unchanged schedule → no conflict queries at all, save passes through.
    await service.update('s-1', { notes: 'updated notes only' });
    expect(repo.save).toHaveBeenCalled();

    // Changing only the notes must not trigger window validation.
    expect(qb.where).not.toHaveBeenCalled();
  });

  it('update re-validates a changed window and passes when no conflict exists', async () => {
    repo.findOne.mockResolvedValue(existingSession());
    repo.createQueryBuilder
      .mockReturnValueOnce(makeQb([])) // group overlap
      .mockReturnValueOnce(makeQb([])) // teacher overlap
      .mockReturnValueOnce(makeQb([])); // classroom overlap
    groupRepo.findOne.mockResolvedValue(GROUP);

    const saved = await service.update('s-1', {
      date: '2026-10-08',
      start_time: '12:00:00',
      end_time: '13:00:00',
    });
    expect(saved).toBeTruthy();
    expect(repo.save).toHaveBeenCalled();
  });

  it('update with force=true bypasses conflicts', async () => {
    repo.findOne.mockResolvedValue(existingSession());
    repo.createQueryBuilder
      .mockReturnValueOnce(makeQb([{ id: 's-clash' }]))
      .mockReturnValueOnce(makeQb([{ id: 's-clash' }]))
      .mockReturnValueOnce(makeQb([{ id: 's-clash' }]));
    groupRepo.findOne.mockResolvedValue(GROUP);

    await service.update('s-1', {
      date: '2026-10-01',
      start_time: '10:30:00',
      end_time: '11:30:00',
      force: true,
    });
    expect(repo.save).toHaveBeenCalled();
  });

  // ---------- concurrency safety: locked transactions ----------

  it('create (non-force) row-locks the group + takes teacher/room advisory locks in one transaction', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb([]));
    groupRepo.findOne.mockResolvedValue({ ...GROUP, mode: GroupMode.IN_PERSON });

    await service.create({
      group_id: 'g1',
      classroom_id: 'c1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(txQueries.some((q) => /FROM groups WHERE id = \$1 FOR UPDATE/.test(q.sql))).toBe(true);
    const advisory = txQueries
      .filter((q) => q.sql.includes('pg_advisory_xact_lock'))
      .map((q) => q.params[0]);
    expect(advisory).toEqual(['sched.room:c1', 'sched.teacher:t1']);
    expect(repo.save).toHaveBeenCalled();
  });

  it('create with force=true skips the transaction and locks entirely', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb([]));
    groupRepo.findOne.mockResolvedValue({ ...GROUP, mode: GroupMode.IN_PERSON });

    await service.create({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
      force: true,
    });

    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });

  it('update with a changed window locks the group + teacher/room in one transaction', async () => {
    repo.findOne.mockResolvedValue(existingSession());
    repo.createQueryBuilder
      .mockReturnValueOnce(makeQb([])) // group overlap
      .mockReturnValueOnce(makeQb([])) // teacher overlap
      .mockReturnValueOnce(makeQb([])); // classroom overlap
    groupRepo.findOne.mockResolvedValue(GROUP);
    groupRepo.find.mockResolvedValue([GROUP]);

    await service.update('s-1', {
      date: '2026-10-08',
      start_time: '12:00:00',
      end_time: '13:00:00',
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(txQueries.some((q) => /FROM groups WHERE id = ANY\(\$1::uuid\[\]\) ORDER BY id FOR UPDATE/.test(q.sql))).toBe(true);
    const advisory = txQueries
      .filter((q) => q.sql.includes('pg_advisory_xact_lock'))
      .map((q) => q.params[0]);
    // Old and new classroom are both c1 (unchanged) → one deduped room lock.
    expect(advisory).toEqual(['sched.room:c1', 'sched.teacher:t1']);
    expect(repo.save).toHaveBeenCalled();
  });

  it('update without a window change keeps the unlocked legacy path', async () => {
    repo.findOne.mockResolvedValue(existingSession());

    await service.update('s-1', { notes: 'no window change' });

    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(repo.save).toHaveBeenCalled();
  });
});
