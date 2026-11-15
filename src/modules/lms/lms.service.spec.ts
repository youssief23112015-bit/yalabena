import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LmsService } from './lms.service';
import { LmsModule } from '../../shared/entities/lms-module.entity';
import { LmsLesson } from '../../shared/entities/lms-lesson.entity';
import { LmsResource } from '../../shared/entities/lms-resource.entity';
import { Assignment } from '../../shared/entities/assignment.entity';
import { Submission } from '../../shared/entities/submission.entity';
import { Quiz } from '../../shared/entities/quiz.entity';
import { QuizQuestion } from '../../shared/entities/quiz-question.entity';
import { QuizOption } from '../../shared/entities/quiz-option.entity';
import { QuizAttempt } from '../../shared/entities/quiz-attempt.entity';
import { GradebookCategory } from '../../shared/entities/gradebook-category.entity';
import { GradebookEntry } from '../../shared/entities/gradebook-entry.entity';
import { TeacherEvaluation } from '../../shared/entities/teacher-evaluation.entity';
import { StudentSurvey } from '../../shared/entities/student-survey.entity';
import { Group } from '../../shared/entities/group.entity';
import { Student } from '../../shared/entities/student.entity';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { User } from '../../shared/entities/user.entity';
import { AttemptStatus } from '../../common/enums/attempt-status.enum';
import { SubmissionStatus } from '../../common/enums/submission-status.enum';
import { EnrollmentStatus } from '../../common/enums/enrollment-status.enum';
import { QuestionType } from '../../common/enums/question-type.enum';

const mockRepo = () => {
  const repo: Record<string, any> = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn((x) => Promise.resolve(x)),
    // EntityManager.create(entityClass, plainObject) returns a new entity;
    // honor the two-argument call used inside transactions.
    create: jest.fn((...args: any[]) => args[1] ?? args[0]),
    count: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };
  // manager mirrors the repo so service code running inside
  // `manager.transaction(...)` can call findOne/count/create/save.
  repo.manager = {
    transaction: jest.fn(async (fn) => fn(repo)),
    ...repo,
  };
  return repo;
};

describe('LmsService', () => {
  let service: LmsService;
  let attemptRepo: ReturnType<typeof mockRepo>;
  let quizRepo: ReturnType<typeof mockRepo>;
  let catRepo: ReturnType<typeof mockRepo>;
  let entryRepo: ReturnType<typeof mockRepo>;
  let enrollmentRepo: ReturnType<typeof mockRepo>;
  let resourceRepo: ReturnType<typeof mockRepo>;
  let assignmentRepo: ReturnType<typeof mockRepo>;
  let submissionRepo: ReturnType<typeof mockRepo>;
  let studentRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LmsService,
        { provide: getRepositoryToken(LmsModule), useFactory: mockRepo },
        { provide: getRepositoryToken(LmsLesson), useFactory: mockRepo },
        { provide: getRepositoryToken(LmsResource), useFactory: mockRepo },
        { provide: getRepositoryToken(Assignment), useFactory: mockRepo },
        { provide: getRepositoryToken(Submission), useFactory: mockRepo },
        { provide: getRepositoryToken(Quiz), useFactory: mockRepo },
        { provide: getRepositoryToken(QuizQuestion), useFactory: mockRepo },
        { provide: getRepositoryToken(QuizOption), useFactory: mockRepo },
        { provide: getRepositoryToken(QuizAttempt), useFactory: mockRepo },
        { provide: getRepositoryToken(GradebookCategory), useFactory: mockRepo },
        { provide: getRepositoryToken(GradebookEntry), useFactory: mockRepo },
        { provide: getRepositoryToken(TeacherEvaluation), useFactory: mockRepo },
        { provide: getRepositoryToken(StudentSurvey), useFactory: mockRepo },
        { provide: getRepositoryToken(Group), useFactory: mockRepo },
        { provide: getRepositoryToken(Student), useFactory: mockRepo },
        { provide: getRepositoryToken(Enrollment), useFactory: mockRepo },
        { provide: getRepositoryToken(User), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get(LmsService);
    attemptRepo = module.get(getRepositoryToken(QuizAttempt));
    quizRepo = module.get(getRepositoryToken(Quiz));
    catRepo = module.get(getRepositoryToken(GradebookCategory));
    entryRepo = module.get(getRepositoryToken(GradebookEntry));
    enrollmentRepo = module.get(getRepositoryToken(Enrollment));
    resourceRepo = module.get(getRepositoryToken(LmsResource));
    assignmentRepo = module.get(getRepositoryToken(Assignment));
    submissionRepo = module.get(getRepositoryToken(Submission));
    studentRepo = module.get(getRepositoryToken(Student));
    // Default so submitAttempt's resolveStudentId('student1') resolves in the
    // pre-existing auto-grading tests (they pass 'student1' as the user id).
    studentRepo.findOne.mockResolvedValue({ id: 'student1', user_id: 'student1' });
  });

  // ═══════════════════════════════════════════
  // LMS-TEST-01a: Auto-grading across 5 question types
  // ═══════════════════════════════════════════
  describe('submitAttempt — auto-grading', () => {
    const makeQuestion = (
      overrides: Partial<QuizQuestion>,
    ): QuizQuestion =>
      ({
        id: 'q1',
        points: 10,
        correct_answer: 'A',
        type: QuestionType.MCQ,
        ...overrides,
      } as QuizQuestion);

    const makeAttempt = (questions: QuizQuestion[]): QuizAttempt =>
      ({
        id: 'att1',
        status: AttemptStatus.IN_PROGRESS,
        started_at: new Date(Date.now() - 60_000),
        quiz: {
          id: 'quiz1',
          time_limit_minutes: 30,
          passing_score: 60,
          questions,
        },
        answers: {},
      } as unknown as QuizAttempt);

    it('grades MCQ correct', async () => {
      attemptRepo.findOne.mockResolvedValue(makeAttempt([makeQuestion({})]));

      const result = await service.submitAttempt('att1', 'student1', { q1: 'A' }, 30);
      expect(result.score).toBe(10);
      expect(result.percentage).toBe(100);
      expect(result.is_passed).toBe(true);
    });

    it('grades True/False case-insensitively', async () => {
      attemptRepo.findOne.mockResolvedValue(
        makeAttempt([
          makeQuestion({
            type: QuestionType.TRUE_FALSE,
            correct_answer: 'true',
          }),
        ]),
      );

      const result = await service.submitAttempt('att1', 'student1', { q1: 'TRUE' }, 30);
      expect(result.score).toBe(10);
    });

    it('grades Matching only when ALL pairs match', async () => {
      attemptRepo.findOne.mockImplementation(() =>
        Promise.resolve(
          makeAttempt([
            makeQuestion({
              type: QuestionType.MATCHING,
              correct_answer: { cat: 'feline', dog: 'canine' },
            }),
          ]),
        ),
      );

      let result = await service.submitAttempt(
          'att1', 'student1',
          { q1: { cat: 'feline', dog: 'canine' } },
        30,
      );
      expect(result.score).toBe(10);

      result = await service.submitAttempt(
          'att1', 'student1',
          { q1: { cat: 'feline', dog: 'wrong' } },
        30,
      );
      expect(result.score).toBe(0);
    });

    it('grades Ordering only for exact sequence', async () => {
      attemptRepo.findOne.mockImplementation(() =>
        Promise.resolve(
          makeAttempt([
            makeQuestion({
              type: QuestionType.ORDERING,
              correct_answer: ['first', 'second', 'third'],
            }),
          ]),
        ),
      );

      let result = await service.submitAttempt(
          'att1', 'student1',
          { q1: ['first', 'second', 'third'] },
        30,
      );
      expect(result.score).toBe(10);

      result = await service.submitAttempt(
          'att1', 'student1',
          { q1: ['second', 'first', 'third'] },
        30,
      );
      expect(result.score).toBe(0);
    });

    it('flags Short Answer for manual review without auto-scoring', async () => {
      attemptRepo.findOne.mockResolvedValue(
        makeAttempt([
          makeQuestion({
            type: QuestionType.SHORT_ANSWER,
            correct_answer: 'Paris',
          }),
        ]),
      );

      const result = await service.submitAttempt('att1', 'student1', { q1: 'Paris' }, 30);
      expect(result.score).toBe(0);
      expect(result.needs_manual_review).toBe(true);
      expect(result.status).toBe(AttemptStatus.PENDING_REVIEW);
    });

    it('enforces server-side time limit', async () => {
      const attempt = makeAttempt([makeQuestion({})]);
      attempt.started_at = new Date(Date.now() - 31 * 60 * 1000);
      attemptRepo.findOne.mockResolvedValue(attempt);

      await expect(
        service.submitAttempt('att1', 'student1', { q1: 'A' }, 1860),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════
  // LMS-TEST-01b: Weighted gradebook calculation
  // ═══════════════════════════════════════════
  // ══════════════════════════════════════════════════
  // LMS-TEST-01d: startAttempt single-attempt enforcement
  // ══════════════════════════════════════════════════
  describe('startAttempt single-attempt enforcement', () => {
    const makeQuiz = (maxAttempts: number): Quiz =>
      ({
        id: 'quiz1',
        max_attempts: maxAttempts,
        passing_score: 60,
      } as Quiz);

    it('blocks when attempts already reach max_attempts', async () => {
      quizRepo.findOne.mockResolvedValue(makeQuiz(1));
      quizRepo.count.mockResolvedValue(1);
      studentRepo.findOne.mockResolvedValue({ id: 's1', user_id: 'u1' });

      await expect(
        service.startAttempt('quiz1', 'u1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws the configured max-attempts message', async () => {
      quizRepo.findOne.mockResolvedValue(makeQuiz(1));
      quizRepo.count.mockResolvedValue(1);
      studentRepo.findOne.mockResolvedValue({ id: 's1', user_id: 'u1' });

      await expect(
        service.startAttempt('quiz1', 'u1'),
      ).rejects.toThrow(
        'You have already reached the maximum attempts for this quiz',
      );
    });

    it('allows starting when attempts remain', async () => {
      const quiz = makeQuiz(2);
      quizRepo.findOne.mockResolvedValue(quiz);
      quizRepo.count.mockResolvedValue(1);
      studentRepo.findOne.mockResolvedValue({ id: 's1', user_id: 'u1' });
      quizRepo.create.mockImplementation((...args: any[]) => args[1] ?? args[0]);
      quizRepo.save.mockResolvedValue(quiz as any);

      const result = await service.startAttempt('quiz1', 'u1');
      expect(result).toBeDefined();
    });
  });

  describe('calculateWeightedGrade', () => {
    it('computes weighted average with full scores', async () => {
      catRepo.find.mockResolvedValue([
        { id: 'c1', name: 'Attendance', weight: 10 },
        { id: 'c2', name: 'Assignments', weight: 30 },
        { id: 'c3', name: 'Midterm', weight: 30 },
        { id: 'c4', name: 'Final', weight: 30 },
      ]);
      entryRepo.find.mockResolvedValue([
        { category_id: 'c1', score: 100 },
        { category_id: 'c2', score: 80 },
        { category_id: 'c3', score: 70 },
        { category_id: 'c4', score: 90 },
      ]);

      const result = await service.calculateWeightedGrade('g1', 's1');
      expect(result.overallPercentage).toBe(82);
    });

    it('treats missing categories as zero contribution', async () => {
      catRepo.find.mockResolvedValue([
        { id: 'c1', name: 'Attendance', weight: 50 },
        { id: 'c2', name: 'Final', weight: 50 },
      ]);
      entryRepo.find.mockResolvedValue([{ category_id: 'c1', score: 80 }]);

      const result = await service.calculateWeightedGrade('g1', 's1');
      expect(result.overallPercentage).toBe(40);
      expect(
        result.breakdown.find((b) => b.category === 'Final')?.average,
      ).toBeNull();
    });

    it('averages multiple entries within a category', async () => {
      catRepo.find.mockResolvedValue([
        { id: 'c1', name: 'Assignments', weight: 100 },
      ]);
      entryRepo.find.mockResolvedValue([
        { category_id: 'c1', score: 70 },
        { category_id: 'c1', score: 90 },
      ]);

      const result = await service.calculateWeightedGrade('g1', 's1');
      expect(result.overallPercentage).toBe(80);
    });
  });

  // ═══════════════════════════════════════════
  // LMS-TEST-01c: EnrollmentGuard blocks non-enrolled
  // ═══════════════════════════════════════════
  describe('assertEnrolledForResource', () => {
    it('throws ForbiddenException when no active enrollment', async () => {
      studentRepo.findOne.mockResolvedValue({ id: 's1', user_id: 'u1' });
      resourceRepo.findOne.mockResolvedValue({
        id: 'r1',
        lesson: { module: { group_id: 'g1' } },
      });
      enrollmentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.assertEnrolledForResource('r1', 'u1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('passes when active enrollment exists', async () => {
      studentRepo.findOne.mockResolvedValue({ id: 's1', user_id: 'u1' });
      resourceRepo.findOne.mockResolvedValue({
        id: 'r1',
        lesson: { module: { group_id: 'g1' } },
      });
      enrollmentRepo.findOne.mockResolvedValue({
        id: 'e1',
        status: EnrollmentStatus.ACTIVE,
      });

      await expect(
        service.assertEnrolledForResource('r1', 'u1'),
      ).resolves.toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════
  // LMS-BE-06: Deadline blocking
  // ═══════════════════════════════════════════
  describe('submitAssignment deadline enforcement', () => {
    it('blocks submission past due when allow_late=false', async () => {
      studentRepo.findOne.mockResolvedValue({ id: 's1', user_id: 'u1' });
      assignmentRepo.findOne.mockResolvedValue({
        id: 'a1',
        due_at: new Date(Date.now() - 1000),
        allow_late_submission: false,
      });

      await expect(
        service.submitAssignment(
          { assignment_id: 'a1', content: 'x' },
          'u1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows late submission when allow_late=true and marks is_late', async () => {
      studentRepo.findOne.mockResolvedValue({ id: 's1', user_id: 'u1' });
      assignmentRepo.findOne.mockResolvedValue({
        id: 'a1',
        due_at: new Date(Date.now() - 1000),
        allow_late_submission: true,
      });
      submissionRepo.findOne.mockResolvedValue(null);

      const result = await service.submitAssignment(
        { assignment_id: 'a1', content: 'late work' },
        'u1',
      );
      expect(result.is_late).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════
  // LMS-TEST-02: Quiz attempt lifecycle (start → submit → ownership)
  // ══════════════════════════════════════════════════════
  describe('quiz attempt lifecycle', () => {
    const studentId = 'b8430eec-4181-577f-a38b-933397704e7a';
    const userId = '46020932-b634-5ac4-be12-2969f1f15c93';
    const quizId = 'c0e8729c-aca8-5e4e-9f3a-c493539cb88a';
    const attemptId = '51c2f240-65a5-4aa6-a84e-50130ebe5687';

    const inProgressAttempt = (): QuizAttempt =>
      ({
        id: attemptId,
        quiz_id: quizId,
        student_id: studentId,
        attempt_number: 1,
        status: AttemptStatus.IN_PROGRESS,
        started_at: new Date(),
        answers: {},
        quiz: { id: quizId, questions: [] },
      } as unknown as QuizAttempt);

    beforeEach(() => {
      jest.clearAllMocks();
      studentRepo.findOne.mockResolvedValue({ id: studentId, user_id: userId });
    });

    it('startAttempt creates and returns a persisted attempt with an ID', async () => {
      quizRepo.findOne.mockResolvedValue({ id: quizId, max_attempts: 2 });
      quizRepo.count.mockResolvedValue(0);
      quizRepo.create.mockImplementation((...args: any[]) => args[1] ?? args[0]);
      quizRepo.save.mockResolvedValue({
        id: attemptId,
        quiz_id: quizId,
        student_id: studentId,
      });

      const result = await service.startAttempt(quizId, userId);

      expect(result.id).toBe(attemptId);
      expect(quizRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quiz_id: quizId,
          student_id: studentId,
          attempt_number: 1,
          status: AttemptStatus.IN_PROGRESS,
          answers: {},
        }),
      );
    });

    it('submitAttempt succeeds and persists the graded attempt', async () => {
      attemptRepo.findOne.mockResolvedValue(inProgressAttempt());

      const result = await service.submitAttempt(attemptId, userId, { q1: 'A' }, 30);

      expect(result).toBeDefined();
      // Ownership-scoped lookup was used (user id resolved to student id).
      // EntityManager.findOne(entityClass, options) is called with two args.
      expect(attemptRepo.findOne).toHaveBeenCalledWith(
        QuizAttempt,
        expect.objectContaining({
          where: { id: attemptId, student_id: studentId },
        }),
      );
      expect(attemptRepo.save).toHaveBeenCalled();
    });

    it('submitAttempt returns 404 for an unknown attempt ID', async () => {
      attemptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.submitAttempt('no-such-attempt', userId, {}, 30),
      ).rejects.toThrow(NotFoundException);
    });

    it('submitAttempt rejects a cross-student submission (ownership enforced)', async () => {
      // Attempt belongs to a different student: the scoped (id + student_id)
      // lookup finds nothing, so submission is rejected.
      attemptRepo.findOne.mockResolvedValue(null);

      await expect(
        service.submitAttempt(attemptId, 'other-user-id', {}, 30),
      ).rejects.toThrow(NotFoundException);
    });

    it('submitAttempt rejects a duplicate submission of a graded attempt', async () => {
      attemptRepo.findOne.mockResolvedValue({
        ...inProgressAttempt(),
        status: AttemptStatus.GRADED,
      });

      await expect(
        service.submitAttempt(attemptId, userId, {}, 30),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // LMS-BE-13: getMyAttempts — authenticated student's own attempt history
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  describe('getMyAttempts', () => {
    const studentId = 'b8430eec-4181-577f-a38b-933397704e7a';
    const userId = '46020932-b634-5ac4-be12-2969f1f15c93';
    const quizId = 'c0e8729c-aca8-5e4e-9f3a-c493539cb88a';
    const otherGroupId = '00000000-0000-0000-0000-000000000000';

    const gradedAttempt = (): QuizAttempt =>
      ({
        id: 'att1',
        quiz_id: quizId,
        student_id: studentId,
        attempt_number: 1,
        status: AttemptStatus.GRADED,
        score: 10,
        percentage: 90.91,
        is_passed: true,
        submitted_at: new Date('2026-11-15T10:44:39.333Z'),
        time_spent_seconds: 4,
        started_at: new Date('2026-11-15T10:44:34.44Z'),
        needs_manual_review: false,
        quiz: {
          id: quizId,
          title: 'Seed Quiz',
          group_id: 'fe652f07-65d3-586c-a5c3-b3ecaeeda736',
          questions: [{ id: 'q1', points: 10 }, { id: 'q2', points: 1 }],
        },
      } as unknown as QuizAttempt);

    const inProgressAttempt = (): QuizAttempt =>
      ({
        id: 'att2',
        quiz_id: quizId,
        student_id: studentId,
        attempt_number: 2,
        status: AttemptStatus.IN_PROGRESS,
        score: null,
        percentage: null,
        is_passed: null,
        submitted_at: null,
        time_spent_seconds: null,
        started_at: new Date(),
        needs_manual_review: false,
        quiz: {
          id: quizId,
          title: 'Seed Quiz',
          group_id: 'fe652f07-65d3-586c-a5c3-b3ecaeeda736',
          questions: [{ id: 'q1', points: 10 }],
        },
      } as unknown as QuizAttempt);

    beforeEach(() => {
      jest.clearAllMocks();
      studentRepo.findOne.mockResolvedValue({ id: studentId, user_id: userId });
    });

    it('returns the authenticated student\'s attempts with score and completion status', async () => {
      attemptRepo.find.mockResolvedValue([gradedAttempt(), inProgressAttempt()]);

      const result = await service.getMyAttempts(userId);

      expect(attemptRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { student_id: studentId } }),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'att1',
        quiz_id: quizId,
        student_id: studentId,
        status: AttemptStatus.GRADED,
        score: 10,
        completed: true,
      });
      expect(result[1]).toMatchObject({
        id: 'att2',
        status: AttemptStatus.IN_PROGRESS,
        completed: false,
      });
    });

    it('resolves the user id to the student profile and scopes attempts by student_id', async () => {
      attemptRepo.find.mockResolvedValue([]);
      await service.getMyAttempts(userId);
      expect(studentRepo.findOne).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(attemptRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { student_id: studentId } }),
      );
    });

    it('throws NotFoundException when the student profile is missing', async () => {
      studentRepo.findOne.mockResolvedValue(null);
      attemptRepo.find.mockResolvedValue([]);
      await expect(service.getMyAttempts(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('filters by group_id when provided', async () => {
      attemptRepo.find.mockResolvedValue([gradedAttempt()]);
      await service.getMyAttempts(userId, otherGroupId);
      const found = attemptRepo.find.mock.calls[0][0];
      // group filtering happens in service after fetch; verify it runs without error
      const result = await service.getMyAttempts(userId, otherGroupId);
      expect(result).toEqual([]);
    });

    it('returns attempts matching the group when group_id matches', async () => {
      attemptRepo.find.mockResolvedValue([gradedAttempt()]);
      const result = await service.getMyAttempts(
        userId,
        'fe652f07-65d3-586c-a5c3-b3ecaeeda736',
      );
      expect(result).toHaveLength(1);
    });
  });
});