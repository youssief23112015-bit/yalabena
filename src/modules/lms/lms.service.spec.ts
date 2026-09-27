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

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  save: jest.fn((x) => Promise.resolve(x)),
  create: jest.fn((x) => x),
  count: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  manager: {
    transaction: jest.fn((fn) => fn({ update: jest.fn() })),
  },
});

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

      const result = await service.submitAttempt('att1', { q1: 'A' }, 30);
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

      const result = await service.submitAttempt('att1', { q1: 'TRUE' }, 30);
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
        'att1',
        { q1: { cat: 'feline', dog: 'canine' } },
        30,
      );
      expect(result.score).toBe(10);

      result = await service.submitAttempt(
        'att1',
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
        'att1',
        { q1: ['first', 'second', 'third'] },
        30,
      );
      expect(result.score).toBe(10);

      result = await service.submitAttempt(
        'att1',
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

      const result = await service.submitAttempt('att1', { q1: 'Paris' }, 30);
      expect(result.score).toBe(0);
      expect(result.needs_manual_review).toBe(true);
      expect(result.status).toBe(AttemptStatus.PENDING_REVIEW);
    });

    it('enforces server-side time limit', async () => {
      const attempt = makeAttempt([makeQuestion({})]);
      attempt.started_at = new Date(Date.now() - 31 * 60 * 1000);
      attemptRepo.findOne.mockResolvedValue(attempt);

      await expect(
        service.submitAttempt('att1', { q1: 'A' }, 1860),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═══════════════════════════════════════════
  // LMS-TEST-01b: Weighted gradebook calculation
  // ═══════════════════════════════════════════
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
      assignmentRepo.findOne.mockResolvedValue({
        id: 'a1',
        due_at: new Date(Date.now() - 1000),
        allow_late_submission: false,
      });

      await expect(
        service.submitAssignment(
          { assignment_id: 'a1', content: 'x' },
          's1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows late submission when allow_late=true and marks is_late', async () => {
      assignmentRepo.findOne.mockResolvedValue({
        id: 'a1',
        due_at: new Date(Date.now() - 1000),
        allow_late_submission: true,
      });
      submissionRepo.findOne.mockResolvedValue(null);

      const result = await service.submitAssignment(
        { assignment_id: 'a1', content: 'late work' },
        's1',
      );
      expect(result.is_late).toBe(true);
    });
  });
});