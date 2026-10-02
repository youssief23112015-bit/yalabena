import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { StrikeAction } from '../../common/enums/strike-action.enum';
import { ViolationAction } from '../../common/enums/violation-action.enum';

describe('ChatService — messaging, moderation & strikes', () => {
  let service: ChatService;
  let roomRepo: any;
  let memberRepo: any;
  let messageRepo: any;
  let violationRepo: any;
  let strikeRepo: any;
  let userRepo: any;
  let groupRepo: any;
  let groupStudentRepo: any;
  let enrollmentRepo: any;
  let userRoleRepo: any;
  let pdfService: any;

  const member = { room_id: 'room-1', user_id: 'u-1', is_banned: false, is_muted: false, role: 'member' };

 beforeEach(() => {
    jest.clearAllMocks();
    roomRepo = {
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => ({ id: 'room-1', ...x })),
      findOne: jest.fn(),
      find: jest.fn(async () => []),
    };
    
    groupRepo = { 
      findOne: jest.fn(), 
      find: jest.fn(async () => []) 
    };
    
    groupStudentRepo = { 
      findOne: jest.fn(), 
      find: jest.fn(async () => []) 
    };
    
    enrollmentRepo = { 
      findOne: jest.fn(), 
      find: jest.fn(async () => []) 
    };

    memberRepo = {
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => x),
      findOne: jest.fn(),
      find: jest.fn(async () => []),
      remove: jest.fn(async () => undefined),
    };
    
    messageRepo = {
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => ({ id: 'msg-1', ...x })),
      find: jest.fn(async () => []),
    };
    
    violationRepo = {
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => ({ id: 'viol-1', ...x })),
      findOne: jest.fn(),
    };
    
    strikeRepo = {
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => x),
      count: jest.fn(async () => 0),
    };
    
    userRepo = {};
    userRoleRepo = { find: jest.fn(async () => []) };
    pdfService = { renderChatAuditPdf: jest.fn(async () => Buffer.from('pdf')) };

    service = new ChatService(
      roomRepo, memberRepo, messageRepo, violationRepo, strikeRepo, userRepo,
      groupRepo, groupStudentRepo, enrollmentRepo, userRoleRepo, pdfService,
    );
  });

  describe('saveMessage (SRS 6.4 enforcement path — single source of truth)', () => {
    const dto: any = { room_id: 'room-1', body: 'Hello everyone' };

    it('rejects non-members and banned users', async () => {
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.saveMessage(dto, 'u-1')).rejects.toThrow(ForbiddenException);

      memberRepo.findOne.mockResolvedValue({ ...member, is_banned: true });
      await expect(service.saveMessage(dto, 'u-1')).rejects.toThrow(ForbiddenException);
      expect(messageRepo.save).not.toHaveBeenCalled();
    });

    it('rejects muted users while the mute is active', async () => {
      memberRepo.findOne.mockResolvedValue({
        ...member,
        is_muted: true,
        muted_until: new Date(Date.now() + 3600_000),
      });
      await expect(service.saveMessage(dto, 'u-1')).rejects.toThrow(ForbiddenException);
      expect(messageRepo.save).not.toHaveBeenCalled();
    });

    it('blocks contact-info messages BEFORE persistence and logs the violation + strike (exactly once)', async () => {
      memberRepo.findOne.mockResolvedValue({ ...member });
      await expect(
        service.saveMessage({ ...dto, body: 'call me on 01012345678' }, 'u-1'),
      ).rejects.toThrow(ForbiddenException);

      expect(messageRepo.save).not.toHaveBeenCalled(); // never persisted
      expect(violationRepo.save).toHaveBeenCalledTimes(1); // single strike — no double-scan
      expect(violationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          message_id: null,
          room_id: 'room-1',
          sender_id: 'u-1',
          rule_matched: 'phone_egyptian',
          action_taken: ViolationAction.BLOCKED,
        }),
      );
      expect(strikeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'u-1', strike_number: 1, action: StrikeAction.WARNING }),
      );
    });

    it('persists a clean message and returns it', async () => {
      memberRepo.findOne.mockResolvedValue({ ...member });
      const res = await service.saveMessage(dto, 'u-1');
      expect(messageRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ sender_id: 'u-1', body: 'Hello everyone' }),
      );
      expect(res.id).toBe('msg-1');
      expect(violationRepo.save).not.toHaveBeenCalled();
    });

    it('rejects external attachment URLs (SRS 7.2)', async () => {
      memberRepo.findOne.mockResolvedValue({ ...member });
      await expect(
        service.saveMessage({ ...dto, file_url: 'https://evil.com/malware.exe' }, 'u-1'),
      ).rejects.toThrow(BadRequestException);
      expect(messageRepo.save).not.toHaveBeenCalled();
    });

    it('accepts internal upload URLs', async () => {
      memberRepo.findOne.mockResolvedValue({ ...member });
      await service.saveMessage({ ...dto, file_url: '/uploads/chat/abc.png' }, 'u-1');
      expect(messageRepo.save).toHaveBeenCalled();
    });
  });

  describe('strike escalation (SRS 6.3)', () => {
    const log = (count: number) => {
      strikeRepo.count.mockResolvedValue(count);
      return service.logViolation('msg-1', 'room-1', 'u-1', 'phone_egyptian', '01012345678', ViolationAction.BLOCKED);
    };

    it('1st strike = warning, no expiry', async () => {
      await log(0);
      expect(strikeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ strike_number: 1, action: StrikeAction.WARNING, expires_at: null }),
      );
    });

    it('2nd strike = 24h mute with expiry', async () => {
      await log(1);
      expect(strikeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          strike_number: 2,
          action: StrikeAction.MUTE_24H,
          expires_at: expect.any(Date),
        }),
      );
    });

    it('3rd strike = permanent ban', async () => {
      await log(2);
      expect(strikeRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ strike_number: 3, action: StrikeAction.BAN_PERMANENT }),
      );
    });
  });

  describe('moderateUser', () => {
    const dto: any = { room_id: 'room-1', user_id: 'u-2', action: 'mute', duration_minutes: 30 };

    it('rejects moderators without a moderator role in the room', async () => {
      roomRepo.findOne.mockResolvedValue({ id: 'room-1' });
      memberRepo.findOne.mockResolvedValue({ ...member, role: 'member' });
      await expect(service.moderateUser(dto, 'u-1')).rejects.toThrow(ForbiddenException);
    });

    it('mutes a user for the given duration', async () => {
      roomRepo.findOne.mockResolvedValue({ id: 'room-1' });
      memberRepo.findOne
        .mockResolvedValueOnce({ ...member, role: 'admin' })
        .mockResolvedValueOnce({ room_id: 'room-1', user_id: 'u-2' });

      const res = await service.moderateUser(dto, 'u-1');
      expect(memberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_muted: true, muted_until: expect.any(Date) }),
      );
      expect(res).toEqual({ success: true, action: 'mute', user_id: 'u-2' });
    });

    it('bans a user with a reason', async () => {
      roomRepo.findOne.mockResolvedValue({ id: 'room-1' });
      memberRepo.findOne
        .mockResolvedValueOnce({ ...member, role: 'moderator' })
        .mockResolvedValueOnce({ room_id: 'room-1', user_id: 'u-2' });

      await service.moderateUser({ ...dto, action: 'ban', reason: 'spam' }, 'u-1');
      expect(memberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_banned: true, ban_reason: 'spam' }),
      );
    });
  });

  describe('exportRoomMessagesCsv (SRS 6.5)', () => {
    it('escapes commas/quotes and marks deleted messages', async () => {
      messageRepo.find.mockResolvedValue([
        {
          id: 'm1', created_at: new Date('2026-09-20T10:00:00Z'), sender_id: 'u-1',
          sender: { first_name: 'Ahmed', last_name: 'Ali' }, type: 'text',
          deleted_at: null, edited_count: 0, body: 'hello, "world"', file_url: null, file_name: null,
        },
        {
          id: 'm2', created_at: new Date('2026-09-20T10:05:00Z'), sender_id: 'u-2',
          sender: null, type: 'text', deleted_at: new Date(), edited_count: 2,
          body: 'removed', file_url: null, file_name: null,
        },
      ]);

      const csv = await service.exportRoomMessagesCsv('room-1');
      const lines = csv.split('\n');
      expect(lines[0]).toBe('id,created_at,sender_id,sender_name,type,deleted,edited_count,body,file_url,file_name');
      expect(lines[1]).toContain('"hello, ""world"""');
      expect(lines[1]).toContain('Ahmed Ali');
      expect(lines[1]).toContain(',no,');
      expect(lines[2]).toContain(',yes,');
      expect(lines[2]).toContain(',2,');
    });
  });

  describe('rooms & violations', () => {
    it('createRoom adds the creator as admin and extra members', async () => {
      roomRepo.findOne.mockResolvedValue({ id: 'room-1' });
      await service.createRoom({ name: 'Class A', member_ids: ['u-1', 'u-2'] } as any, 'u-1');
      expect(memberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ room_id: 'room-1', user_id: 'u-1', role: 'admin' }),
      );
      expect(memberRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({ user_id: 'u-2', role: 'member' }),
      ]);
    });

    it('getRoom forbids banned members', async () => {
      memberRepo.findOne.mockResolvedValue({ ...member, is_banned: true });
      await expect(service.getRoom('room-1', 'u-1')).rejects.toThrow(ForbiddenException);
    });

    it('leaveRoom throws for non-members', async () => {
      memberRepo.findOne.mockResolvedValue(null);
      await expect(service.leaveRoom('room-1', 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('resolveViolation marks resolution and false-positive flag', async () => {
      violationRepo.findOne.mockResolvedValue({ id: 'viol-1' });
      await service.resolveViolation('viol-1', 'mod-1', 'legit homework', true);
      expect(violationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          moderator_id: 'mod-1',
          moderator_note: 'legit homework',
          is_false_positive: true,
          resolved_at: expect.any(Date),
        }),
      );
    });
  });

  // ─── FIX: joinRoom authorization (enrollment / room access) ───

  describe('joinRoom — enrollment & room access (Critical fix)', () => {
    const groupRoom = {
      id: 'room-1',
      group_id: 'g-1',
      group: { id: 'g-1', teacher_id: 't-1', substitute_teacher_id: null },
    };

    beforeEach(() => {
      memberRepo.findOne.mockResolvedValue(null); // not already a member
    });

    it('rejects joining a group room when NOT enrolled (and not staff/teacher)', async () => {
      roomRepo.findOne.mockResolvedValue(groupRoom);
      userRoleRepo.find.mockResolvedValue([]); // no roles
      groupStudentRepo.findOne.mockResolvedValue(null);
      enrollmentRepo.findOne.mockResolvedValue(null);

      await expect(service.joinRoom('room-1', 'u-1')).rejects.toThrow(ForbiddenException);
      expect(memberRepo.save).not.toHaveBeenCalled();
    });

    it('allows joining a group room as an ACTIVE group_student', async () => {
      roomRepo.findOne.mockResolvedValue(groupRoom);
      userRoleRepo.find.mockResolvedValue([]);
      groupStudentRepo.findOne.mockResolvedValue({ student: { user_id: 'u-1' } });

      await service.joinRoom('room-1', 'u-1');
      expect(memberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ room_id: 'room-1', user_id: 'u-1', role: 'member' }),
      );
    });

    it('allows joining a group room via an ACTIVE enrollment', async () => {
      roomRepo.findOne.mockResolvedValue(groupRoom);
      userRoleRepo.find.mockResolvedValue([]);
      groupStudentRepo.findOne.mockResolvedValue({ student: { user_id: 'someone-else' } });
      enrollmentRepo.findOne.mockResolvedValue({ student: { user_id: 'u-1' } });

      await service.joinRoom('room-1', 'u-1');
      expect(memberRepo.save).toHaveBeenCalled();
    });

    it('allows the group teacher to join without enrollment', async () => {
      roomRepo.findOne.mockResolvedValue(groupRoom);
      userRoleRepo.find.mockResolvedValue([]);

      await service.joinRoom('room-1', 't-1');
      expect(memberRepo.save).toHaveBeenCalled();
      expect(groupStudentRepo.findOne).not.toHaveBeenCalled();
    });

    it('allows staff roles (super_admin) to join any room', async () => {
      roomRepo.findOne.mockResolvedValue(groupRoom);
      userRoleRepo.find.mockResolvedValue([{ role: { slug: 'super_admin' } }]);

      await service.joinRoom('room-1', 'u-1');
      expect(memberRepo.save).toHaveBeenCalled();
    });

    it('rejects self-joining a non-group room without prior membership', async () => {
      roomRepo.findOne.mockResolvedValue({ id: 'room-1', group_id: null, group: null });
      userRoleRepo.find.mockResolvedValue([]);

      await expect(service.joinRoom('room-1', 'u-1')).rejects.toThrow(ForbiddenException);
      expect(memberRepo.save).not.toHaveBeenCalled();
    });

    it('is idempotent for existing members (no authorization re-check needed)', async () => {
      roomRepo.findOne.mockResolvedValue(groupRoom);
      memberRepo.findOne.mockResolvedValue({ ...member });

      const res = await service.joinRoom('room-1', 'u-1');
      expect(res.user_id).toBe('u-1');
      expect(memberRepo.save).not.toHaveBeenCalled();
    });
  });
    // ─── Automatic group chat rooms & seamless access ───

  describe('group chat room provisioning (automatic rooms & access)', () => {
    const group = { id: 'g-1', name: 'Physics 101', teacher_id: 't-1', substitute_teacher_id: 's-1' };

    it('ensureGroupChatRoom creates one GROUP room per group (idempotent) and seats the teachers', async () => {
      roomRepo.findOne.mockResolvedValue(null);
      groupRepo.findOne.mockResolvedValue(group);
      memberRepo.findOne.mockResolvedValue(null);

      await service.ensureGroupChatRoom('g-1');

      expect(roomRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ group_id: 'g-1', name: 'Physics 101 — Group Chat', created_by: 't-1' }),
      );
      expect(memberRepo.save).toHaveBeenCalledWith(expect.objectContaining({ user_id: 't-1', role: 'teacher' }));
      expect(memberRepo.save).toHaveBeenCalledWith(expect.objectContaining({ user_id: 's-1', role: 'teacher' }));

      roomRepo.findOne.mockResolvedValue({ id: 'room-g', group_id: 'g-1' });
      await service.ensureGroupChatRoom('g-1');
      expect(roomRepo.save).toHaveBeenCalledTimes(1); // second call reuses the existing room
    });

    it('syncGroupChatRoom adds active group students and enrollment students', async () => {
      roomRepo.findOne.mockResolvedValue({ id: 'room-g', group_id: 'g-1' });
      groupRepo.findOne.mockResolvedValue(group);
      groupStudentRepo.find.mockResolvedValue([{ group_id: 'g-1', student: { user_id: 'stu-1' } }]);
      enrollmentRepo.find.mockResolvedValue([{ group_id: 'g-1', student: { user_id: 'stu-2' } }]);
      memberRepo.findOne.mockResolvedValue(null);

      await service.syncGroupChatRoom('g-1');

      expect(memberRepo.save).toHaveBeenCalledWith(expect.objectContaining({ room_id: 'room-g', user_id: 'stu-1', role: 'member' }));
      expect(memberRepo.save).toHaveBeenCalledWith(expect.objectContaining({ room_id: 'room-g', user_id: 'stu-2', role: 'member' }));
      expect(memberRepo.save).toHaveBeenCalledWith(expect.objectContaining({ room_id: 'room-g', user_id: 't-1', role: 'teacher' }));
    });

    it('syncGroupChatRoom never overwrites moderation state of existing members', async () => {
      roomRepo.findOne.mockResolvedValue({ id: 'room-g', group_id: 'g-1' });
      groupRepo.findOne.mockResolvedValue(group);
      groupStudentRepo.find.mockResolvedValue([{ group_id: 'g-1', student: { user_id: 'stu-1' } }]);
      enrollmentRepo.find.mockResolvedValue([]);
      memberRepo.findOne.mockResolvedValue({ room_id: 'room-g', user_id: 'stu-1', is_banned: true, role: 'member' });

      await service.syncGroupChatRoom('g-1');
      expect(memberRepo.save).not.toHaveBeenCalled(); // existing banned member left untouched
    });

    it('findRooms auto-joins a student into their group room even without prior membership', async () => {
      memberRepo.find.mockResolvedValue([]);
      userRoleRepo.find.mockResolvedValue([]); // not staff
      groupRepo.find.mockResolvedValue([]);
      groupStudentRepo.find.mockResolvedValue([{ group_id: 'g-1', student: { user_id: 'u-1' } }]);
      enrollmentRepo.find.mockResolvedValue([]);
      roomRepo.findOne.mockResolvedValue(null); // no room yet → provision it
      groupRepo.findOne.mockResolvedValue(group);
      groupStudentRepo.findOne.mockResolvedValue({ student: { user_id: 'u-1' } });
      memberRepo.findOne.mockResolvedValue(null);

      const rooms = await service.findRooms('u-1');

      expect(roomRepo.save).toHaveBeenCalledWith(expect.objectContaining({ group_id: 'g-1' }));
      expect(memberRepo.save).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u-1', role: 'member' }));
      expect(rooms).toHaveLength(1);
    });

    it('findRooms surfaces every group room to staff without writing member rows', async () => {
      memberRepo.find.mockResolvedValue([]);
      userRoleRepo.find.mockResolvedValue([{ role: { slug: 'academic' } }]);
      roomRepo.find.mockResolvedValue([{ id: 'room-g', type: 'group', group: { id: 'g-1' } }]);

      const rooms = await service.findRooms('staff-1');

      expect(rooms).toHaveLength(1);
      expect(memberRepo.save).not.toHaveBeenCalled();
    });

   it('getRoom seamlessly provisions eligible students on first access', async () => {
      roomRepo.findOne
        .mockResolvedValueOnce({ id: 'room-g', group_id: 'g-1', group }) // auto-join lookup
        .mockResolvedValueOnce({ id: 'room-g', members: [] });          // reload after join
      userRoleRepo.find.mockResolvedValue([]);
      groupStudentRepo.findOne.mockResolvedValue({ student: { user_id: 'u-1' } });

      // استخدام mockImplementation لضمان الاستجابة الصحيحة بغض النظر عن عدد الاستدعاءات
      memberRepo.findOne.mockImplementation(async (query: any) => {
        if (query && query.relations) {
          // الاستجابة النهائية عند جلب الغرفة مع العلاقات
          return { 
            room_id: 'room-g', 
            user_id: 'u-1', 
            is_banned: false, 
            room: { id: 'room-g', members: [] } 
          };
        }
        // الاستجابات الأولية (التحقق من عدم وجود العضوية مسبقاً)
        return null;
      });

      const room = await service.getRoom('room-g', 'u-1');
      expect(memberRepo.save).toHaveBeenCalled();
      expect(room.id).toBe('room-g');
    });
  });
});