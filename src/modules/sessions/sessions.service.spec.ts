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
    create: jest.fn((p) => ({ ...p })),
    save: jest.fn(async (p) => ({ id: 'session-1', ...p })),
    remove: jest.fn(async () => undefined),
  } as any;
}

describe('SessionsService — conflict detection & auto-meetings (SRS 4.5.2 / 5.1)', () => {
  let service: SessionsService;
  let repo: ReturnType<typeof makeRepo>;
  let groupRepo: ReturnType<typeof makeRepo>;
  let zoom: any;
  let onmeet: any;

  const GROUP = {
    id: 'g1',
    teacher_id: 't1',
    substitute_teacher_id: null,
    mode: GroupMode.IN_PERSON,
  };

  beforeEach(() => {
    repo = makeRepo();
    groupRepo = makeRepo();
    zoom = { isConfigured: jest.fn().mockReturnValue(false), createMeeting: jest.fn() };
    onmeet = { isConfigured: jest.fn().mockReturnValue(false), createMeeting: jest.fn() };
    service = new SessionsService(repo, groupRepo, zoom, onmeet, new ConfigService({}));
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

  // ---------- auto meeting (SRS 5.1) ----------

  it('auto-creates a Zoom meeting for online sessions when Zoom is configured', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb([]));
    groupRepo.findOne.mockResolvedValue({ ...GROUP, mode: GroupMode.ONLINE });
    zoom.isConfigured.mockReturnValue(true);
    zoom.createMeeting.mockResolvedValue({
      meeting_id: 'zm-123',
      join_url: 'https://zoom.us/j/zm-123',
      password: null,
      start_url: null,
    });

    await service.create({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        zoom_meeting_id: 'zm-123',
        zoom_join_url: 'https://zoom.us/j/zm-123',
      }),
    );
  });

  it('falls back to OnMeet when Zoom creation fails', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb([]));
    groupRepo.findOne.mockResolvedValue({ ...GROUP, mode: GroupMode.ONLINE });
    zoom.isConfigured.mockReturnValue(true);
    zoom.createMeeting.mockRejectedValue(new Error('zoom down'));
    onmeet.isConfigured.mockReturnValue(true);
    onmeet.createMeeting.mockResolvedValue({
      meeting_id: 'om-9',
      join_url: 'https://onmeet.example/om-9',
      password: null,
      start_url: null,
    });

    await service.create({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        onmeet_meeting_id: 'om-9',
        onmeet_join_url: 'https://onmeet.example/om-9',
      }),
    );
  });

  it('never blocks session creation when no meeting provider is configured', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb([]));
    groupRepo.findOne.mockResolvedValue({ ...GROUP, mode: GroupMode.ONLINE });

    const saved = await service.create({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
    });

    expect(saved.id).toBe('session-1');
    expect(zoom.createMeeting).not.toHaveBeenCalled();
    expect(onmeet.createMeeting).not.toHaveBeenCalled();
  });

  it('respects a manual meeting link and skips auto-creation', async () => {
    repo.createQueryBuilder.mockReturnValue(makeQb([]));
    groupRepo.findOne.mockResolvedValue({ ...GROUP, mode: GroupMode.ONLINE });
    zoom.isConfigured.mockReturnValue(true);

    await service.create({
      group_id: 'g1',
      date: '2026-10-01',
      start_time: '10:00:00',
      end_time: '11:00:00',
      zoom_join_url: 'https://zoom.us/j/manual',
    });

    expect(zoom.createMeeting).not.toHaveBeenCalled();
  });
});
