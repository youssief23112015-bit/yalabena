import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PlacementTestsService } from './placement-tests.service';
import { PlacementTest } from '../../shared/entities/placement-test.entity';
import { TestQuestion } from '../../shared/entities/test-question.entity';
import { PlacementTestAnswer } from '../../shared/entities/placement-test-answer.entity';
import { Lead } from '../../shared/entities/lead.entity';
import { Student } from '../../shared/entities/student.entity';
import { User } from '../../shared/entities/user.entity';
import { TestSlot } from '../../shared/entities/test-slot.entity';
import { TestSlotsService } from '../test-slots/test-slots.service';
import { TestStatus } from '../../common/enums/test-status.enum';
import { SlotStatus } from '../../common/enums/slot-status.enum';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { LeadSource } from '../../common/enums/lead-source.enum';
import { QuestionType } from '../../common/enums/question-type.enum';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn((x: any) => Promise.resolve({ ...x })),
  create: jest.fn((x: any) => ({ ...x })),
  count: jest.fn().mockResolvedValue(0),
  createQueryBuilder: jest.fn(),
  manager: { transaction: jest.fn() },
});

/** Chainable lead-lookup QB resolving getOne(). */
const leadQb = (one: any = null) => ({
  where: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(one),
});

const TOMORROW = new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);

describe('PlacementTestsService', () => {
  let service: PlacementTestsService;
  let testRepo: ReturnType<typeof mockRepo>;
  let questionRepo: ReturnType<typeof mockRepo>;
  let leadRepo: ReturnType<typeof mockRepo>;
  let studentRepo: ReturnType<typeof mockRepo>;
  let slotRepo: ReturnType<typeof mockRepo>;
  let slots: { findOne: jest.Mock };

  const user = { id: 'user-1', roles: ['student'] };
  const student = {
    id: 'stu-1',
    user_id: 'user-1',
    status: 'active',
    current_level: 'B1',
    user: {
      id: 'user-1',
      phone: '01011112222',
      email: 'sara@x.com',
      first_name: 'Sara',
      last_name: 'Mostafa',
    },
  };
  const openSlot = {
    id: 's-1',
    examiner_id: 'exam-1',
    date: TOMORROW,
    start_time: '10:00',
    end_time: '11:00',
    capacity: 2,
    booked_count: 0,
    status: SlotStatus.OPEN,
  };
  const lead = { id: 'lead-9', status: LeadStatus.TEST_SCHEDULED };

  let savedTest: any = null;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlacementTestsService,
        { provide: getRepositoryToken(PlacementTest), useFactory: mockRepo },
        { provide: getRepositoryToken(TestQuestion), useFactory: mockRepo },
        { provide: getRepositoryToken(PlacementTestAnswer), useFactory: mockRepo },
        { provide: getRepositoryToken(Lead), useFactory: mockRepo },
        { provide: getRepositoryToken(Student), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
        { provide: getRepositoryToken(TestSlot), useFactory: mockRepo },
        { provide: TestSlotsService, useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get(PlacementTestsService);
    testRepo = module.get(getRepositoryToken(PlacementTest));
    questionRepo = module.get(getRepositoryToken(TestQuestion));
    leadRepo = module.get(getRepositoryToken(Lead));
    studentRepo = module.get(getRepositoryToken(Student));
    slotRepo = module.get(getRepositoryToken(TestSlot));
    slots = module.get(TestSlotsService);

    savedTest = null;
    studentRepo.findOne.mockResolvedValue({ ...student, user: { ...student.user } });
    slots.findOne.mockResolvedValue({ ...openSlot });
    leadRepo.createQueryBuilder.mockReturnValue(leadQb(null));
    leadRepo.create.mockImplementation((x: any) => ({ ...x }));
    leadRepo.save.mockImplementation(async (x: any) => ({ id: 'lead-1', ...x }));
    testRepo.create.mockImplementation((x: any) => ({ ...x }));
    testRepo.save.mockImplementation(async (x: any) => {
      savedTest = { ...x, id: x.id ?? 'test-1' };
      return savedTest;
    });
    // dup-active lookup (student_id) → null; :id lookups → the saved row
    testRepo.findOne.mockImplementation(async ({ where }: any) => {
      if (where?.student_id && !where?.id) return null;
      if (where?.id) return savedTest;
      return null;
    });
  });

  afterEach(() => jest.clearAllMocks());

  // ═════════════════════════════════════════════
  // Business Rule 1/2 — Authenticated student slot booking
  // ═════════════════════════════════════════════
  describe('bookForStudent', () => {
    it('books the slot, targets student_id, reserves the seat and upserts the Lead', async () => {
      const out = await service.bookForStudent(user, { slot_id: 's-1' });

      expect(testRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: 'stu-1',
          slot_id: 's-1',
          examiner_id: 'exam-1',
          status: TestStatus.SCHEDULED,
        }),
      );
      // No lead_id on the row — chk_pt_target forbids both targets
      expect(testRepo.create.mock.calls[0][0].lead_id).toBeUndefined();
      // seat reserved
      expect(slotRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ booked_count: 1 }),
      );
      // Lead upserted with TEST_SCHEDULED (created — none matched)
      expect(leadRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: LeadStatus.TEST_SCHEDULED,
          source: LeadSource.WEBSITE,
          phone: '01011112222',
        }),
      );
      expect(out.status).toBe(TestStatus.SCHEDULED);
    });

    it('advances an existing matched lead instead of duplicating it', async () => {
      leadRepo.createQueryBuilder.mockReturnValue(leadQb({ ...lead }));
      await service.bookForStudent(user, { slot_id: 's-1' });
      expect(leadRepo.create).not.toHaveBeenCalled();
      expect(leadRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'lead-9', status: LeadStatus.TEST_SCHEDULED }),
      );
    });

    it('404s without a student profile', async () => {
      studentRepo.findOne.mockResolvedValue(null);
      await expect(service.bookForStudent(user, { slot_id: 's-1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects a full slot with 409', async () => {
      slots.findOne.mockResolvedValue({ ...openSlot, booked_count: 2, capacity: 2 });
      await expect(service.bookForStudent(user, { slot_id: 's-1' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects a past slot with 400', async () => {
      slots.findOne.mockResolvedValue({ ...openSlot, date: YESTERDAY });
      await expect(service.bookForStudent(user, { slot_id: 's-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a cancelled slot with 400', async () => {
      slots.findOne.mockResolvedValue({ ...openSlot, status: SlotStatus.CANCELLED });
      await expect(service.bookForStudent(user, { slot_id: 's-1' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a second booking while an active test exists', async () => {
      testRepo.findOne.mockImplementation(async ({ where }: any) => {
        if (where?.student_id && !where?.id) return { id: 't-9' };
        if (where?.id) return savedTest;
        return null;
      });
      await expect(service.bookForStudent(user, { slot_id: 's-1' })).rejects.toThrow(
        ConflictException,
      );
      expect(testRepo.save).not.toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════════════
  // Business Rule 2 — Evaluation → Lead/Student sync
  // ═════════════════════════════════════════════
  describe('evaluate / update', () => {
    const leadTest = () => ({
      id: 't-1',
      status: TestStatus.SCHEDULED,
      lead_id: 'lead-9',
      student_id: null as string | null,
      written_score: null as number | null,
      written_max: 100,
      oral_score: null as number | null,
      oral_max: 100,
      suggested_level: null as string | null,
      final_level: null as string | null,
    });

    it('derives the CEFR level from the score and syncs the Lead (final)', async () => {
      testRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === 't-1' ? leadTest() : null,
      );
      leadRepo.findOne.mockResolvedValue({ ...lead });

      const out = await service.evaluate('t-1', { written_score: 85 });

      expect(out.status).toBe(TestStatus.COMPLETED);
      expect(out.suggested_level).toBe('C1'); // 85% → C1
      expect(out.final_level).toBe('C1');
      expect(leadRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'lead-9',
          placement_score: 85,
          placement_level: 'C1',
          level_interest: 'C1',
          status: LeadStatus.TEST_COMPLETED,
        }),
      );
    });

    it('student test: mirrors the level to Student.current_level and syncs the Lead', async () => {
      testRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === 't-2'
          ? {
              ...leadTest(),
              id: 't-2',
              status: TestStatus.IN_PROGRESS,
              lead_id: null,
              student_id: 'stu-1',
              written_score: 62,
              oral_score: 80,
            }
          : null,
      );
      leadRepo.createQueryBuilder.mockReturnValue(leadQb(null));
      // The student currently sits a level BELOW the evaluated result so the
      // sync has an actual transition to persist (B1 vs A2).
      studentRepo.findOne.mockResolvedValue({
        ...student,
        current_level: 'A2',
        user: { ...student.user },
      });

      const out = await service.evaluate('t-2', { final_level: 'B1' });

      expect(out.final_level).toBe('B1');
      expect(out.suggested_level).toBe('B2'); // (62+80)/2 = 71% → B2
      // Lead found-or-created by the student's contact, result applied
      expect(leadRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          placement_score: 71,
          placement_level: 'B1',
          status: LeadStatus.TEST_COMPLETED,
        }),
      );
      // Registered student level updated
      expect(studentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'stu-1', current_level: 'B1' }),
      );
    });

    it('rejects a non-CEFR final_level with 400 before saving', async () => {
      testRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === 't-1' ? leadTest() : null,
      );
      await expect(service.evaluate('t-1', { final_level: 'Z9' })).rejects.toThrow(
        BadRequestException,
      );
      expect(testRepo.save).not.toHaveBeenCalled();
    });

    it('rejects completion without any score or level', async () => {
      testRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === 't-1' ? leadTest() : null,
      );
      await expect(service.evaluate('t-1', {})).rejects.toThrow(BadRequestException);
      expect(testRepo.save).not.toHaveBeenCalled();
    });

    it('maps the admin form assigned_level onto final_level (legacy alias)', async () => {
      testRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === 't-4' ? { ...leadTest(), id: 't-4' } : null,
      );
      const out = await service.update('t-4', { assigned_level: 'B2' } as any);
      expect(out.final_level).toBe('B2');
      expect(out.override_reason).toBeTruthy();
    });
  });

  // ═════════════════════════════════════════════
  // Auto-score result handler → Lead/Student sync
  // ═════════════════════════════════════════════
  describe('submitWritten', () => {
    it('auto-scores, derives the CEFR level, and syncs the Lead (written phase)', async () => {
      testRepo.findOne.mockResolvedValue({
        id: 't-9',
        status: TestStatus.SCHEDULED,
        lead_id: 'lead-9',
        student_id: null,
        written_score: null,
        written_max: 100,
        oral_score: null,
        oral_max: 100,
        suggested_level: null,
        final_level: null,
      });
      questionRepo.find.mockResolvedValue([
        { id: 'q1', type: QuestionType.MCQ, points: 10, correct_answer: 'a' },
        { id: 'q2', type: QuestionType.MCQ, points: 10, correct_answer: 'b' },
      ]);
      const manager = {
        delete: jest.fn(),
        create: jest.fn((x: any) => x),
        save: jest.fn(),
        update: jest.fn(),
      };
      testRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));
      leadRepo.findOne.mockResolvedValue({ ...lead });

      const out = await service.submitWritten('t-9', {
        answers: [
          { question_id: 'q1', answer: 'a' },
          { question_id: 'q2', answer: 'b' },
        ],
      } as any);

      expect(out.percentage).toBe(100);
      expect(out.level).toBe('C2'); // 100% → C2
      expect(manager.update).toHaveBeenCalledWith(
        PlacementTest,
        { id: 't-9' },
        expect.objectContaining({
          suggested_level: 'C2',
          final_level: 'C2',
          status: TestStatus.IN_PROGRESS,
        }),
      );
      // Lead receives the degree + evaluated level, awaiting oral follow-up
      expect(leadRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'lead-9',
          placement_score: 100,
          placement_level: 'C2',
          level_interest: 'C2',
          status: LeadStatus.INTERESTED,
        }),
      );
    });
  });

  // ═════════════════════════════════════════════
  // Staff-created bookings advance the lead pipeline
  // ═════════════════════════════════════════════
  describe('create', () => {
    it('advances the linked lead to TEST_SCHEDULED', async () => {
      leadRepo.findOne.mockResolvedValue({ id: 'lead-9', status: LeadStatus.NEW });
      const out = await service.create({ lead_id: 'lead-9' } as any);
      expect(leadRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'lead-9', status: LeadStatus.TEST_SCHEDULED }),
      );
      expect(out.id).toBe('test-1');
    });

    it('never regresses an ENROLLED lead', async () => {
      leadRepo.findOne.mockResolvedValue({ id: 'lead-9', status: LeadStatus.ENROLLED });
      await service.create({ lead_id: 'lead-9' } as any);
      expect(leadRepo.save).not.toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════════════
  // Public onboarding — Path A: instant guest test
  // ═════════════════════════════════════════════
  describe('bookInstant', () => {
    const dto = {
      name: 'Omar Saad',
      phone: '01022223333',
      email: 'omar@x.com',
      level_interest: 'B1', // course context handed over from /catalog/:id
    };

    it('upserts the Lead (TEST_SCHEDULED) and creates a lead-only session', async () => {
      const out = await service.bookInstant(dto);

      expect(out).toEqual({ success: true, testId: 'test-1', leadId: 'lead-1' });
      // Name split + lead upsert (deduped by phone/email by the shared helper)
      expect(leadRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Omar',
          last_name: 'Saad',
          phone: '01022223333',
          email: 'omar@x.com',
          level_interest: 'B1',
          source: LeadSource.WEBSITE,
          status: LeadStatus.TEST_SCHEDULED,
        }),
      );
      // Lead-only target (chk_pt_target), no slot/examiner, scheduled NOW
      expect(testRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ lead_id: 'lead-1', status: TestStatus.SCHEDULED }),
      );
      const created = testRepo.create.mock.calls[0][0];
      expect(created.student_id).toBeUndefined();
      expect(created.slot_id).toBeUndefined();
      expect(created.examiner_id).toBeUndefined();
      expect(created.scheduled_at).toBeInstanceOf(Date);
    });

    it('a single-word name lands in both name fields', async () => {
      await service.bookInstant({ name: 'Omar', phone: '01022223333' });
      expect(leadRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ first_name: 'Omar', last_name: 'Omar' }),
      );
    });

    it('resumes an open session instead of creating a duplicate', async () => {
      testRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.lead_id && !where?.id ? { id: 't-active', status: TestStatus.SCHEDULED } : null,
      );

      const out = await service.bookInstant(dto);

      expect(out).toEqual({ success: true, testId: 't-active', leadId: 'lead-1' });
      expect(testRepo.save).not.toHaveBeenCalled(); // no new session
      expect(leadRepo.createQueryBuilder).toHaveBeenCalled(); // Lead still ensured
    });
  });

  // ═════════════════════════════════════════════
  // Public onboarding — guest session execution
  // ═════════════════════════════════════════════
  describe('guest session endpoints', () => {
    const guestTest = (overrides: Record<string, any> = {}) => ({
      id: 'g-1',
      lead_id: 'lead-9',
      student_id: null,
      status: TestStatus.SCHEDULED,
      written_score: null,
      written_max: 100,
      suggested_level: null,
      final_level: null,
      lead: { id: 'lead-9', first_name: 'Omar' },
      ...overrides,
    });
    const asIdLookup = (fixture: any) =>
      testRepo.findOne.mockImplementation(async ({ where }: any) =>
        where?.id === fixture.id ? fixture : null,
      );

    it('getGuestSession validates the link and reports an open session', async () => {
      asIdLookup(guestTest());
      const out = await service.getGuestSession('g-1');
      expect(out).toMatchObject({
        testId: 'g-1',
        completed: false,
        first_name: 'Omar',
        result: null,
      });
    });

    it('getGuestSession returns the stored result once completed', async () => {
      asIdLookup(
        guestTest({
          status: TestStatus.COMPLETED,
          written_score: 85,
          suggested_level: 'C1',
          final_level: 'C1',
        }),
      );
      const out = await service.getGuestSession('g-1');
      expect(out.completed).toBe(true);
      expect(out.result).toEqual({ score: 85, maxScore: 100, percentage: 85, level: 'C1' });
    });

    it('403s guest access to a registered STUDENT-owned test', async () => {
      asIdLookup(guestTest({ lead_id: null, student_id: 'stu-1' }));
      await expect(service.getGuestSession('g-1')).rejects.toThrow(ForbiddenException);
      await expect(service.submitGuest('g-1', { answers: [] } as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('getGuestPaper serves questions for an open session (no auth)', async () => {
      asIdLookup(guestTest());
      questionRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'q1', type: QuestionType.MCQ, points: 5, question_text: '?', options: ['a'] },
        ]),
      });

      const out = await service.getGuestPaper('g-1', { level: 'A1' });
      expect(out.testId).toBe('g-1');
      expect(out.totalPoints).toBe(5);
      expect(out.questions).toHaveLength(1);
    });

    it('getGuestPaper refuses a COMPLETED session', async () => {
      asIdLookup(guestTest({ status: TestStatus.COMPLETED }));
      await expect(service.getGuestPaper('g-1', {})).rejects.toThrow(BadRequestException);
    });

    it('submitGuest finalizes the test AND the lead (score, level, test_completed)', async () => {
      asIdLookup(guestTest());
      questionRepo.find.mockResolvedValue([
        { id: 'q1', type: QuestionType.MCQ, points: 10, correct_answer: 'a' },
        { id: 'q2', type: QuestionType.MCQ, points: 10, correct_answer: 'b' },
      ]);
      const manager = {
        delete: jest.fn(),
        create: jest.fn((x: any) => x),
        save: jest.fn(),
        update: jest.fn(),
      };
      testRepo.manager.transaction.mockImplementation(async (cb: any) => cb(manager));
      leadRepo.findOne.mockResolvedValue({ ...lead });

      const out = await service.submitGuest('g-1', {
        answers: [
          { question_id: 'q1', answer: 'a' },
          { question_id: 'q2', answer: 'b' },
        ],
      } as any);

      // Test itself is finalized (single-session guest flow)
      expect(manager.update).toHaveBeenCalledWith(
        PlacementTest,
        { id: 'g-1' },
        expect.objectContaining({
          status: TestStatus.COMPLETED,
          suggested_level: 'C2',
          final_level: 'C2',
        }),
      );
      // Lead receives score + CEFR level + TEST_COMPLETED (Business Rule 3b)
      expect(leadRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'lead-9',
          placement_score: 100,
          placement_level: 'C2',
          status: LeadStatus.TEST_COMPLETED,
        }),
      );
      expect(out.percentage).toBe(100);
      expect(out.level).toBe('C2');
    });
  });
});
