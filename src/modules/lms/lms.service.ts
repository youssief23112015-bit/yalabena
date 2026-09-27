import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as fs from 'fs';

import { LmsModule as LmsModuleEntity } from '../../shared/entities/lms-module.entity';
import { LmsLesson } from '../../shared/entities/lms-lesson.entity';
import { LmsResource } from '../../shared/entities/lms-resource.entity';
import { ResourceType } from '../../common/enums/resource-type.enum';
import { Assignment } from '../../shared/entities/assignment.entity';
import { Submission } from '../../shared/entities/submission.entity';
import { ReleaseType } from '../../common/enums/release-type.enum';
import { Quiz } from '../../shared/entities/quiz.entity';
import { AssignmentType } from '../../common/enums/assignment-type.enum';

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
import { ReleaseMode } from '../../common/enums/release-mode.enum';
import { QuestionType } from '../../common/enums/question-type.enum';

import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateResourceDto } from './dto/create-resource.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateGradebookCategoryDto } from './dto/create-gradebook-category.dto';
import { CreateGradebookEntryDto } from './dto/create-gradebook-entry.dto';

@Injectable()
export class LmsService {
  constructor(
    @InjectRepository(LmsModuleEntity)
    private readonly moduleRepo: Repository<LmsModuleEntity>,
    @InjectRepository(LmsLesson)
    private readonly lessonRepo: Repository<LmsLesson>,
    @InjectRepository(LmsResource)
    private readonly resourceRepo: Repository<LmsResource>,
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private readonly questionRepo: Repository<QuizQuestion>,
    @InjectRepository(QuizAttempt)
    private readonly attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(GradebookCategory)
    private readonly catRepo: Repository<GradebookCategory>,
    @InjectRepository(GradebookEntry)
    private readonly entryRepo: Repository<GradebookEntry>,
    @InjectRepository(TeacherEvaluation)
    private readonly evalRepo: Repository<TeacherEvaluation>,
    @InjectRepository(StudentSurvey)
    private readonly surveyRepo: Repository<StudentSurvey>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // ═══════════════════════════════════════════════════
  // GROUPS & COHORTS
  // ═══════════════════════════════════════════════════

  async findGroupsForUser(userId: string, roles: string[] = []): Promise<Group[]> {
    const normalizedRoles = (roles || []).map((r) => String(r).toLowerCase());

    const isAdminOrStaff = normalizedRoles.some((role) =>
      ['super_admin', 'admin', 'academic', 'teacher', 'instructor'].includes(role),
    );

    if (isAdminOrStaff) {
      return this.groupRepo.find({
        relations: ['course', 'branch'],
        order: { created_at: 'DESC' },
      });
    }

    const student = await this.studentRepo.findOne({
      where: { user_id: userId },
    });

    if (!student) {
      return this.groupRepo.find({
        relations: ['course', 'branch'],
        order: { created_at: 'DESC' },
      });
    }

    const enrollments = await this.enrollmentRepo.find({
      where: {
        student_id: student.id,
        status: EnrollmentStatus.ACTIVE,
      },
      relations: ['group', 'group.course', 'group.branch'],
    });

    return enrollments
      .map((e) => e.group)
      .filter((g): g is Group => Boolean(g));
  }

  // ═══════════════════════════════════════════════════
  // MODULES (LMS-BE-01)
  // ═══════════════════════════════════════════════════

  async createModule(dto: CreateModuleDto, userId: string): Promise<LmsModuleEntity> {
    const module = this.moduleRepo.create({
      name: dto.title,
      description: dto.description,
      group_id: dto.group_id,
      order: dto.order_index,
      created_by: userId,
    });
    return this.moduleRepo.save(module);
  }

  async findModules(groupId: string): Promise<LmsModuleEntity[]> {
    return this.moduleRepo.find({
      where: { group_id: groupId },
      relations: ['lessons', 'lessons.resources'],
      order: { order: 'ASC' },
    });
  }

  async updateModule(id: string, dto: UpdateModuleDto): Promise<LmsModuleEntity> {
    const module = await this.moduleRepo.findOne({ where: { id } });
    if (!module) throw new NotFoundException('Module not found');
    Object.assign(module, dto);
    return this.moduleRepo.save(module);
  }

  async deleteModule(id: string): Promise<void> {
    const module = await this.moduleRepo.findOne({ where: { id } });
    if (!module) throw new NotFoundException('Module not found');
    await this.moduleRepo.remove(module);
  }

  async reorderModules(groupId: string, orderedIds: string[]): Promise<void> {
    await this.moduleRepo.manager.transaction(async (em) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await em.update(
          LmsModuleEntity,
          { id: orderedIds[i], group_id: groupId },
          { order: i + 1 },
        );
      }
    });
  }

  // ═══════════════════════════════════════════════════
  // LESSONS (LMS-BE-02)
  // ═══════════════════════════════════════════════════

  async createLesson(dto: CreateLessonDto): Promise<LmsLesson> {
    const lesson = this.lessonRepo.create({
      module_id: dto.module_id,
      name: dto.title,
      content: dto.content,
      order: dto.order_index,
    });
    return this.lessonRepo.save(lesson);
  }

  async findLessons(moduleId: string): Promise<LmsLesson[]> {
    return this.lessonRepo.find({
      where: { module_id: moduleId },
      relations: ['resources'],
      order: { order: 'ASC' },
    });
  }

  async updateLesson(id: string, dto: UpdateLessonDto): Promise<LmsLesson> {
    const lesson = await this.lessonRepo.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    Object.assign(lesson, {
      ...(dto.module_id ? { module_id: dto.module_id } : {}),
      ...(dto.title ? { name: dto.title } : {}),
      ...(dto.content !== undefined ? { content: dto.content } : {}),
      ...(dto.order_index !== undefined ? { order: dto.order_index } : {}),
    });
    return this.lessonRepo.save(lesson);
  }

  async deleteLesson(id: string): Promise<void> {
    const lesson = await this.lessonRepo.findOne({ where: { id } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonRepo.remove(lesson);
  }

  // ═══════════════════════════════════════════════════
  // RESOURCES (LMS-BE-03)
  // ═══════════════════════════════════════════════════

  async createResource(dto: CreateResourceDto): Promise<LmsResource> {
    const resource = this.resourceRepo.create({
      lesson_id: dto.lesson_id,
      name: dto.title,
      type: dto.type as unknown as ResourceType,
      file_url: dto.file_url ?? '',
    });
    return this.resourceRepo.save(resource);
  }

  async getResourceForDownload(
    id: string,
  ): Promise<{ title: string; fileBuffer: Buffer }> {
    const resource = await this.resourceRepo.findOne({ where: { id } });
    if (!resource) throw new NotFoundException('Resource not found');
    const fileBuffer = fs.readFileSync(resource.file_url);
    return { title: resource.name, fileBuffer };
  }

  async assertEnrolledForResource(
    resourceId: string,
    userId: string,
  ): Promise<void> {
    const resource = await this.resourceRepo.findOne({
      where: { id: resourceId },
      relations: ['lesson', 'lesson.module'],
    });
    if (!resource) throw new NotFoundException('Resource not found');

    const groupId = resource.lesson?.module?.group_id;
    if (!groupId)
      throw new NotFoundException('Resource is not attached to a course');

    const studentProfile = await this.studentRepo.findOne({
      where: { user_id: userId },
    });
    if (!studentProfile) throw new ForbiddenException('Student profile not found');

    const enrollment = await this.enrollmentRepo.findOne({
      where: {
        group_id: groupId,
        student_id: studentProfile.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to access this resource',
      );
    }
  }

  // ═══════════════════════════════════════════════════
  // PDF WATERMARKING (LMS-BE-04)
  // ═══════════════════════════════════════════════════

  async getWatermarkedPdf(
    resourceId: string,
    userId: string,
  ): Promise<Buffer> {
    await this.assertEnrolledForResource(resourceId, userId);

    const resource = await this.resourceRepo.findOne({
      where: { id: resourceId },
    });
    if (!resource) throw new NotFoundException('Resource not found');

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const existingPdfBytes = fs.readFileSync(resource.file_url);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const watermarkText = `${user.first_name} ${user.last_name}  •  ${user.email}  •  ${new Date().toISOString()}  •  UID:${userId}`;

    for (const page of pages) {
      const { width, height } = page.getSize();
      page.drawText(watermarkText, {
        x: 40,
        y: height / 2,
        size: 10,
        font,
        color: rgb(0.7, 0.1, 0.1),
        opacity: 0.35,
        rotate: degrees(45),
      });
      page.drawText(watermarkText, {
        x: 40,
        y: 20,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.6,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  // ═══════════════════════════════════════════════════
  // ASSIGNMENTS (LMS-BE-05)
  // ═══════════════════════════════════════════════════

  async createAssignment(
    dto: CreateAssignmentDto,
    userId: string,
  ): Promise<Assignment> {
    const assignment = this.assignmentRepo.create({
      group_id: dto.group_id,
      title: dto.title,
      description: dto.instructions,
      type: AssignmentType.FILE_UPLOAD,
      due_at: dto.due_at ? new Date(dto.due_at) : undefined,
      max_grade: dto.max_score ?? 100,
      allow_late_submission: dto.allow_late ?? false,
      created_by: userId,
    });
    return this.assignmentRepo.save(assignment);
  }

  async findAssignments(groupId: string): Promise<Assignment[]> {
    return this.assignmentRepo.find({
      where: { group_id: groupId },
      order: { created_at: 'DESC' },
    });
  }

  async updateAssignment(
    id: string,
    dto: UpdateAssignmentDto,
  ): Promise<Assignment> {
    const assignment = await this.assignmentRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    Object.assign(assignment, {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.instructions !== undefined
        ? { description: dto.instructions }
        : {}),
      ...((dto as any).max_score !== undefined
        ? { max_grade: (dto as any).max_score }
        : {}),
      ...(dto.due_at ? { due_at: new Date(dto.due_at) } : {}),
      ...(dto.allow_late !== undefined
        ? { allow_late_submission: dto.allow_late }
        : {}),
    });
    return this.assignmentRepo.save(assignment);
  }

  async deleteAssignment(id: string): Promise<void> {
    const assignment = await this.assignmentRepo.findOne({ where: { id } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.assignmentRepo.remove(assignment);
  }

  // ═══════════════════════════════════════════════════
  // SUBMISSIONS (LMS-BE-06)
  // ═══════════════════════════════════════════════════

  async submitAssignment(
    dto: SubmitAssignmentDto,
    studentId: string,
  ): Promise<Submission> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: dto.assignment_id },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const now = new Date();
    const isPastDue = assignment.due_at ? now > assignment.due_at : false;

    if (isPastDue && !assignment.allow_late_submission) {
      throw new BadRequestException(
        'The deadline for this assignment has passed',
      );
    }

    const existing = await this.submissionRepo.findOne({
      where: { assignment_id: dto.assignment_id, student_id: studentId },
    });

    if (existing) {
      existing.content = dto.content;
      existing.file_url = dto.file_url;
      existing.file_name = dto.file_name;
      existing.submitted_at = now;
      existing.is_late = isPastDue;
      existing.status = SubmissionStatus.RESUBMITTED;
      return this.submissionRepo.save(existing);
    }

    const submission = this.submissionRepo.create({
      assignment_id: dto.assignment_id,
      student_id: studentId,
      content: dto.content,
      file_url: dto.file_url,
      file_name: dto.file_name,
      submitted_at: now,
      is_late: isPastDue,
      status: SubmissionStatus.SUBMITTED,
    });
    return this.submissionRepo.save(submission);
  }

  async findSubmissions(assignmentId: string): Promise<Submission[]> {
    return this.submissionRepo.find({
      where: { assignment_id: assignmentId },
      relations: ['student'],
      order: { submitted_at: 'DESC' },
    });
  }

  // ═══════════════════════════════════════════════════
  // GRADING (LMS-BE-07)
  // ═══════════════════════════════════════════════════

  async gradeSubmission(
    id: string,
    dto: GradeSubmissionDto,
    userId: string,
  ): Promise<Submission> {
    const submission = await this.submissionRepo.findOne({
      where: { id },
      relations: ['assignment'],
    });
    if (!submission) throw new NotFoundException('Submission not found');

    const maxScore = (submission.assignment as any)?.max_grade ?? 100;
    if (dto.score > maxScore) {
      throw new BadRequestException(
        `Score cannot exceed max score of ${maxScore}`,
      );
    }

    submission.grade = dto.score;
    submission.feedback = dto.feedback;
    submission.graded_by = userId;
    submission.graded_at = new Date();
    submission.status = SubmissionStatus.GRADED;
    return this.submissionRepo.save(submission);
  }

  // ═══════════════════════════════════════════════════
  // QUIZZES (LMS-BE-08)
  // ═══════════════════════════════════════════════════

  async createQuiz(dto: CreateQuizDto, userId: string): Promise<Quiz> {
    const quiz = this.quizRepo.create({
      group_id: dto.group_id,
      title: dto.title,
      description: dto.description,
      time_limit_minutes: dto.time_limit_minutes,
      passing_score: dto.passing_score ?? 60,
      max_attempts: dto.max_attempts ?? 1,
      release_type:
        dto.release_mode === ReleaseMode.INSTANT
          ? ReleaseType.INSTANT
          : ReleaseType.AFTER_REVIEW,
      created_by: userId,
    });
    return this.quizRepo.save(quiz);
  }

  async findQuizzes(groupId: string): Promise<Quiz[]> {
    return this.quizRepo.find({
      where: { group_id: groupId },
      relations: ['questions'],
    });
  }

  // ═══════════════════════════════════════════════════
  // QUESTION BANK (LMS-BE-09)
  // ═══════════════════════════════════════════════════

  async createQuestion(dto: CreateQuestionDto): Promise<QuizQuestion> {
    const question = this.questionRepo.create(dto);
    return this.questionRepo.save(question);
  }

  async getQuestionBank(filters: {
    topic_tag?: string;
    difficulty?: string;
  }): Promise<QuizQuestion[]> {
    const where: Record<string, unknown> = { quiz_id: null };
    if (filters.topic_tag) where.topic_tag = filters.topic_tag;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    return this.questionRepo.find({ where });
  }

  async pullQuestionsFromBank(
    quizId: string,
    filters: { topic_tag?: string; difficulty?: string; limit?: number },
  ): Promise<QuizQuestion[]> {
    const where: Record<string, unknown> = { quiz_id: null };
    if (filters.topic_tag) where.topic_tag = filters.topic_tag;
    if (filters.difficulty) where.difficulty = filters.difficulty;

    const bankQuestions = await this.questionRepo.find({
      where,
      take: filters.limit ?? 10,
    });
    for (const q of bankQuestions) {
      q.quiz_id = quizId;
      await this.questionRepo.save(q);
    }
    return this.questionRepo.find({ where: { quiz_id: quizId } });
  }

  // ═══════════════════════════════════════════════════
  // QUIZ ATTEMPTS (LMS-BE-10)
  // ═══════════════════════════════════════════════════

  async startAttempt(quizId: string, studentId: string): Promise<QuizAttempt> {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const attemptCount = await this.attemptRepo.count({
      where: { quiz_id: quizId, student_id: studentId },
    });
    if (quiz.max_attempts && attemptCount >= quiz.max_attempts) {
      throw new BadRequestException('Maximum attempts reached');
    }

    const attempt = this.attemptRepo.create({
      quiz_id: quizId,
      student_id: studentId,
      attempt_number: attemptCount + 1,
      started_at: new Date(),
      status: AttemptStatus.IN_PROGRESS,
      answers: {},
    });
    return this.attemptRepo.save(attempt);
  }

  async submitAttempt(
    id: string,
    answers: Record<string, unknown>,
    timeSpentSeconds: number,
  ): Promise<QuizAttempt> {
    const attempt = await this.attemptRepo.findOne({
      where: { id },
      relations: ['quiz', 'quiz.questions'],
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Attempt already submitted');
    }

    const quiz = attempt.quiz;
    if (!quiz) throw new NotFoundException('Quiz not found');
    const questions = quiz.questions ?? [];

    if (quiz.time_limit_minutes) {
      const elapsedMs = Date.now() - attempt.started_at.getTime();
      const limitMs = quiz.time_limit_minutes * 60 * 1000;
      if (elapsedMs > limitMs + 5000) {
        attempt.status = AttemptStatus.EXPIRED;
        await this.attemptRepo.save(attempt);
        throw new BadRequestException('Time limit exceeded. Attempt expired.');
      }
    }

    let earnedPoints = 0;
    let totalPoints = 0;
    let needsManualReview = false;
    const gradedAnswers: Record<string, unknown> = {};

    for (const q of questions) {
      totalPoints += q.points;
      const userAnswer = answers[q.id];

      if (userAnswer === undefined) {
        gradedAnswers[q.id] = {
          value: null,
          correct: false,
          points: 0,
          flagged: false,
        };
        continue;
      }

      switch (q.type) {
        case QuestionType.SHORT_ANSWER:
          needsManualReview = true;
          gradedAnswers[q.id] = {
            value: userAnswer,
            correct: null,
            points: 0,
            flagged: true,
          };
          break;

        case QuestionType.MCQ:
        case QuestionType.TRUE_FALSE: {
          const correct =
            String(userAnswer).toLowerCase() ===
            String(q.correct_answer).toLowerCase();
          if (correct) earnedPoints += q.points;
          gradedAnswers[q.id] = {
            value: userAnswer,
            correct,
            points: correct ? q.points : 0,
            flagged: false,
          };
          break;
        }

        case QuestionType.MATCHING: {
          const expected = q.correct_answer as Record<string, string>;
          const given = userAnswer as Record<string, string>;
          const allMatch = Object.keys(expected).every(
            (k) =>
              String(given?.[k]).toLowerCase() ===
              String(expected[k]).toLowerCase(),
          );
          if (allMatch) earnedPoints += q.points;
          gradedAnswers[q.id] = {
            value: userAnswer,
            correct: allMatch,
            points: allMatch ? q.points : 0,
            flagged: false,
          };
          break;
        }

        case QuestionType.ORDERING: {
          const expected = q.correct_answer as string[];
          const given = userAnswer as string[];
          const isOrdered =
            Array.isArray(given) &&
            given.length === expected.length &&
            expected.every(
              (val, idx) =>
                String(val).toLowerCase() ===
                String(given[idx]).toLowerCase(),
            );
          if (isOrdered) earnedPoints += q.points;
          gradedAnswers[q.id] = {
            value: userAnswer,
            correct: isOrdered,
            points: isOrdered ? q.points : 0,
            flagged: false,
          };
          break;
        }
      }
    }

    const autoPercentage =
      totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    attempt.answers = gradedAnswers;
    attempt.score = earnedPoints;
    attempt.percentage = parseFloat(autoPercentage.toFixed(2));
    attempt.is_passed = autoPercentage >= (quiz.passing_score ?? 60);
    attempt.submitted_at = new Date();
    attempt.time_spent_seconds = timeSpentSeconds;
    attempt.status = needsManualReview
      ? AttemptStatus.PENDING_REVIEW
      : AttemptStatus.GRADED;
    attempt.needs_manual_review = needsManualReview;

    return this.attemptRepo.save(attempt);
  }

  // ═══════════════════════════════════════════════════
  // RESULT RELEASE CONTROL (LMS-BE-11)
  // ═══════════════════════════════════════════════════

  async setQuizReleaseMode(
    quizId: string,
    releaseMode: ReleaseMode,
  ): Promise<Quiz> {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    quiz.release_type =
      releaseMode === ReleaseMode.INSTANT
        ? ReleaseType.INSTANT
        : ReleaseType.AFTER_REVIEW;
    return this.quizRepo.save(quiz);
  }

  async getAttemptResultsForStudent(
    attemptId: string,
    studentId: string,
  ): Promise<Record<string, unknown>> {
    const attempt = await this.attemptRepo.findOne({
      where: { id: attemptId, student_id: studentId },
      relations: ['quiz', 'quiz.questions'],
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    const quiz = attempt.quiz;
    if (!quiz) throw new NotFoundException('Quiz not found');

    const released =
      quiz.release_type === ReleaseType.INSTANT ||
      attempt.status === AttemptStatus.RELEASED;

    if (!released) {
      return {
        status: attempt.status,
        message: 'Results will be available after teacher review',
        score: null,
        percentage: null,
        answers: null,
      };
    }

    return {
      status: attempt.status,
      score: attempt.score,
      percentage: attempt.percentage,
      is_passed: attempt.is_passed,
      answers: attempt.answers,
    };
  }

  async releaseAttemptResults(attemptId: string): Promise<QuizAttempt> {
    const attempt = await this.attemptRepo.findOne({
      where: { id: attemptId },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    attempt.status = AttemptStatus.RELEASED;
    return this.attemptRepo.save(attempt);
  }

  // ═══════════════════════════════════════════════════
  // GRADEBOOK (LMS-BE-12)
  // ═══════════════════════════════════════════════════

  async createCategory(
    dto: CreateGradebookCategoryDto,
    userId: string,
  ): Promise<GradebookCategory> {
    const cat = this.catRepo.create({ ...dto, created_by: userId });
    return this.catRepo.save(cat);
  }

  async addEntry(
    dto: CreateGradebookEntryDto,
    userId: string,
  ): Promise<GradebookEntry> {
    const groupId = await this.getGroupIdForStudent(dto.student_id);
    const entry = this.entryRepo.create({
      ...dto,
      group_id: groupId,
      created_by: userId,
    });
    return this.entryRepo.save(entry);
  }

  private async getGroupIdForStudent(studentId: string): Promise<string> {
    const studentProfile = await this.studentRepo.findOne({
      where: { id: studentId },
    });
    if (!studentProfile) throw new NotFoundException('Student not found');
    const enrollment = await this.enrollmentRepo.findOne({
      where: { student_id: studentProfile.id },
      order: { created_at: 'DESC' },
    });
    if (!enrollment)
      throw new NotFoundException('No enrollment found for student');
    return enrollment.group_id;
  }

  async getGradebook(groupId: string): Promise<GradebookEntry[]> {
    return this.entryRepo.find({
      where: { group_id: groupId },
      relations: ['student', 'student.user', 'category'],
    });
  }

  async calculateWeightedGrade(
    groupId: string,
    studentId: string,
  ): Promise<{
    overallPercentage: number;
    breakdown: Array<{
      category: string;
      weight: number;
      average: number | null;
      weightedContribution: number;
    }>;
  }> {
    const categories = await this.catRepo.find({
      where: { group_id: groupId },
    });
    const entries = await this.entryRepo.find({
      where: { group_id: groupId, student_id: studentId },
      relations: ['category'],
    });

    let totalWeight = 0;
    let weightedSum = 0;
    const breakdown: Array<{
      category: string;
      weight: number;
      average: number | null;
      weightedContribution: number;
    }> = [];

    for (const cat of categories) {
      totalWeight += cat.weight;
      const catEntries = entries.filter((e) => e.category_id === cat.id);
      let avg: number | null = null;
      if (catEntries.length > 0) {
        const sum = catEntries.reduce((acc, e) => acc + e.score, 0);
        avg = parseFloat((sum / catEntries.length).toFixed(2));
      }
      const contribution = avg !== null ? (avg * cat.weight) / 100 : 0;
      weightedSum += contribution;
      breakdown.push({
        category: cat.name,
        weight: cat.weight,
        average: avg,
        weightedContribution: parseFloat(contribution.toFixed(2)),
      });
    }

    const overallPercentage =
      totalWeight > 0
        ? parseFloat(((weightedSum / totalWeight) * 100).toFixed(2))
        : 0;

    return { overallPercentage, breakdown };
  }

  // ═══════════════════════════════════════════════════
  // EVALUATIONS & SURVEYS
  // ═══════════════════════════════════════════════════

  async createEvaluation(
    dto: Record<string, unknown>,
  ): Promise<TeacherEvaluation> {
    return this.evalRepo.save(
      this.evalRepo.create(dto as Partial<TeacherEvaluation>),
    );
  }

async getEvaluations(groupId: string, studentId?: string): Promise<TeacherEvaluation[]> {
    const where: any = { group_id: groupId };
    if (studentId) {
      where.student_id = studentId;
    }
    return this.evalRepo.find({
      where,
      relations: ['student', 'teacher'],
      order: { created_at: 'DESC' },
    });
  }
  async createSurvey(dto: Record<string, unknown>): Promise<StudentSurvey> {
    return this.surveyRepo.save(
      this.surveyRepo.create(dto as Partial<StudentSurvey>),
    );
  }
}