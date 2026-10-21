import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Group } from '../../shared/entities/group.entity';
import { GroupSchedule } from '../../shared/entities/group-schedule.entity';
import { User } from '../../shared/entities/user.entity';
import { Student } from '../../shared/entities/student.entity';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { ChatService } from '../chat/chat.service';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn((x: any) => Promise.resolve({ ...x })),
  create: jest.fn((x: any) => ({ ...x })),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
  query: jest.fn(async () => []),
});

/** Chainable SelectQueryBuilder stub used by the conflict engine. */
const qbStub = (many: any[] = []) => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(many),
});

describe('GroupsService', () => {
  let service: GroupsService;
  let groupRepo: ReturnType<typeof mockRepo>;
  let userRepo: ReturnType<typeof mockRepo>;
  let studentRepo: ReturnType<typeof mockRepo>;
  let enrollments: {
    create: jest.Mock;
    approve: jest.Mock;
    countActive: jest.Mock;
    findExisting: jest.Mock;
  };
  let chat: { syncGroupChatRoom: jest.Mock };

  const admin = { id: 'admin-1', roles: ['academic'] };
  const teacher = { id: 't-1', status: 'active', first_name: 'Tina', last_name: 'Teacher' };

  const group = () => ({
    id: 'g-1',
    name: 'B1 Morning',
    course_id: 'c-1',
    teacher_id: 't-0',
    capacity: 10,
    status: 'upcoming',
    course: { id: 'c-1', name: 'B1', level: 'B1' },
    schedules: [
      { day_of_week: 1, start_time: '10:00', end_time: '11:00', classroom_id: null },
    ],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: getRepositoryToken(Group), useFactory: mockRepo },
        { provide: getRepositoryToken(GroupSchedule), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(Student), useFactory: mockRepo },
        {
          provide: EnrollmentsService,
          useValue: {
            create: jest.fn(async (dto: any) => ({ id: 'enr-1', status: 'active', ...dto })),
            approve: jest.fn(async (id: string) => ({ id, status: 'active' })),
            countActive: jest.fn().mockResolvedValue(0),
            findExisting: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: ChatService,
          useValue: { syncGroupChatRoom: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(GroupsService);
    groupRepo = module.get(getRepositoryToken(Group));
    userRepo = module.get(getRepositoryToken(User));
    studentRepo = module.get(getRepositoryToken(Student));
    enrollments = module.get(EnrollmentsService);
    chat = module.get(ChatService);

    // findOne: group row; repo.query: roster / upserts
    groupRepo.findOne.mockResolvedValue(group());
    groupRepo.query.mockResolvedValue([]);
    userRepo.findOne.mockResolvedValue({ ...teacher });
    studentRepo.find.mockResolvedValue([]);
    groupRepo.createQueryBuilder.mockReturnValue(qbStub([]));
  });

  afterEach(() => jest.clearAllMocks());

  // ═════════════════════════════════════════════
  // Business Rule 1 — Direct teacher assignment
  // ═════════════════════════════════════════════
  describe('assignTeacher', () => {
    it('assigns a conflict-free teacher, saves and re-seats the chat room', async () => {
      groupRepo.createQueryBuilder.mockReturnValue(qbStub([])); // no teacher conflicts, no room conflicts

      const out = await service.assignTeacher('g-1', { teacher_id: 't-1' }, admin);

      expect(groupRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'g-1', teacher_id: 't-1' }),
      );
      expect(chat.syncGroupChatRoom).toHaveBeenCalledWith('g-1');
      expect(out).toMatchObject({ teacher_id: 't-1', conflicts: [], overridden: false });
    });

    it('rejects with 409 when the teacher already meets at an overlapping slot', async () => {
      // Teacher loop returns an overlapping group; room loop returns none.
      groupRepo.createQueryBuilder
        .mockReturnValueOnce(
          qbStub([
            {
              name: 'A2 Evening',
              schedules: [{ day_of_week: 1, start_time: '10:30', end_time: '11:30' }],
            },
          ]),
        )
        .mockReturnValueOnce(qbStub([]));

      await expect(
        service.assignTeacher('g-1', { teacher_id: 't-1' }, admin),
      ).rejects.toThrow(ConflictException);
      expect(groupRepo.save).not.toHaveBeenCalled();
    });

    it('overrides conflicts with force=true and reports them in the payload', async () => {
      groupRepo.createQueryBuilder
        .mockReturnValueOnce(
          qbStub([
            {
              name: 'A2 Evening',
              schedules: [{ day_of_week: 1, start_time: '10:30', end_time: '11:30' }],
            },
          ]),
        )
        .mockReturnValueOnce(qbStub([]));

      const out = await service.assignTeacher(
        'g-1',
        { teacher_id: 't-1', force: true },
        admin,
      );

      expect(groupRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ teacher_id: 't-1' }),
      );
      expect(out.overridden).toBe(true);
      expect((out as any).details ?? out.conflicts).toBeDefined();
    });

    it('detects ROOM conflicts against other groups using the same classroom', async () => {
      groupRepo.findOne.mockResolvedValue({
        ...group(),
        schedules: [
          { day_of_week: 3, start_time: '09:00', end_time: '10:00', classroom_id: 'room-9' },
        ],
      });
      groupRepo.createQueryBuilder
        .mockReturnValueOnce(qbStub([])) // teacher loop: no clash
        .mockReturnValueOnce(
          qbStub([
            {
              name: 'C1 Weekend',
              schedules: [
                { day_of_week: 3, start_time: '09:30', end_time: '10:30', classroom_id: 'room-9' },
              ],
            },
          ]),
        );

      await expect(
        service.assignTeacher('g-1', { teacher_id: 't-1' }, admin),
      ).rejects.toThrow(/Room conflict/);
    });

    it('404s for an unknown teacher', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.assignTeacher('g-1', { teacher_id: 'ghost' }, admin),
      ).rejects.toThrow(NotFoundException);
    });

    it('400s for an inactive teacher account', async () => {
      userRepo.findOne.mockResolvedValue({ ...teacher, status: 'inactive' });
      await expect(
        service.assignTeacher('g-1', { teacher_id: 't-1' }, admin),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═════════════════════════════════════════════
  // Business Rule 2 — Direct manual enrollment
  // ═════════════════════════════════════════════
  describe('addStudent', () => {
    it('creates the ACTIVE enrollment and upserts the roster row', async () => {
      const out = await service.addStudent(
        'g-1',
        { student_id: 'stu-1', course_id: 'c-1' },
        admin,
      );

      expect(enrollments.findExisting).toHaveBeenCalledWith('stu-1', 'g-1');
      expect(enrollments.create).toHaveBeenCalledWith(
        { student_id: 'stu-1', group_id: 'g-1' },
        admin,
        { skipCapacityCheck: false },
      );
      // roster upsert (group_students)
      expect(groupRepo.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO group_students'),
        ['g-1', 'stu-1'],
      );
      expect(out).toMatchObject({ roster_status: 'active', already_enrolled: false });
    });

    it('rejects a course_id that does not match the group', async () => {
      await expect(
        service.addStudent('g-1', { student_id: 'stu-1', course_id: 'OTHER' }, admin),
      ).rejects.toThrow(BadRequestException);
      expect(enrollments.create).not.toHaveBeenCalled();
    });

    it('409s when the group is full — unless force=true', async () => {
      enrollments.countActive.mockResolvedValue(10); // group.capacity is 10

      await expect(
        service.addStudent('g-1', { student_id: 'stu-1' }, admin),
      ).rejects.toThrow(ConflictException);
      expect(enrollments.create).not.toHaveBeenCalled();

      const out = await service.addStudent(
        'g-1',
        { student_id: 'stu-1', force: true },
        admin,
      );
      expect(enrollments.create).toHaveBeenCalledWith(
        expect.anything(),
        admin,
        { skipCapacityCheck: true },
      );
      expect(out.already_enrolled).toBe(false);
    });

    it('is idempotent for an existing ACTIVE enrollment (roster reconciled)', async () => {
      enrollments.findExisting.mockResolvedValue({ id: 'enr-9', status: 'active' });

      const out = await service.addStudent('g-1', { student_id: 'stu-1' }, admin);

      expect(out.already_enrolled).toBe(true);
      expect(enrollments.create).not.toHaveBeenCalled();
      expect(groupRepo.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO group_students'),
        ['g-1', 'stu-1'],
      );
    });

    it('finalizes an existing PENDING request through the approval flow', async () => {
      enrollments.findExisting.mockResolvedValue({ id: 'enr-9', status: 'pending' });

      const out = await service.addStudent('g-1', { student_id: 'stu-1' }, admin);

      expect(enrollments.approve).toHaveBeenCalledWith('enr-9', admin);
      expect(enrollments.create).not.toHaveBeenCalled();
      expect(out.approved_pending).toBe(true);
    });
  });

  // ═════════════════════════════════════════════
  // Conflict endpoint + roster loading
  // ═════════════════════════════════════════════
  describe('checkConflicts', () => {
    it('detects overlaps when an explicit weekday + HH:MM window is given', async () => {
      groupRepo.createQueryBuilder.mockReturnValue(
        qbStub([
          {
            name: 'A2 Evening',
            schedules: [{ day_of_week: 1, start_time: '10:30', end_time: '11:30' }],
          },
        ]),
      );
      const out = await service.checkConflicts({
        teacherId: 't-1',
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '11:00',
      });
      expect(out.conflicts).toBe(true);
      expect(out.details[0]).toContain('A2 Evening');
    });

    it('keeps the legacy date-range callers vacuously conflict-free', async () => {
      const out = await service.checkConflicts({
        teacherId: 't-1',
        startTime: '2026-01-01T00:00:00',
        endTime: '2026-06-30T23:59:59',
      });
      expect(out).toEqual({ conflicts: false, details: [] });
      expect(groupRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('findOne roster', () => {
    it('attaches students (roster), the schedule alias and student_count', async () => {
      groupRepo.query.mockResolvedValue([{ student_id: 'stu-1' }]);
      studentRepo.find.mockResolvedValue([{ id: 'stu-1' } as any]);

      const out = await service.findOne('g-1');

      expect(out.students).toHaveLength(1);
      expect(out.schedule).toBeInstanceOf(Array); // alias of schedules
      expect(out.student_count).toBe(1);
    });

    it('returns an empty roster when nobody is enrolled', async () => {
      groupRepo.query.mockResolvedValue([]);
      const out = await service.findOne('g-1');
      expect(out.students).toEqual([]);
      expect(out.student_count).toBe(0);
    });
  });
});
