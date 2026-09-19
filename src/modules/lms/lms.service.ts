import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LmsModule as ModuleEntity } from '../../shared/entities/lms-module.entity';
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
import { AttemptStatus } from '../../common/enums/attempt-status.enum';
import { SubmissionStatus } from '../../common/enums/submission-status.enum';

@Injectable()
export class LmsService {
  constructor(
    @InjectRepository(ModuleEntity) private moduleRepo: Repository<ModuleEntity>,
    @InjectRepository(LmsLesson) private lessonRepo: Repository<LmsLesson>,
    @InjectRepository(LmsResource) private resourceRepo: Repository<LmsResource>,
    @InjectRepository(Assignment) private assignmentRepo: Repository<Assignment>,
    @InjectRepository(Submission) private submissionRepo: Repository<Submission>,
    @InjectRepository(Quiz) private quizRepo: Repository<Quiz>,
    @InjectRepository(QuizQuestion) private questionRepo: Repository<QuizQuestion>,
    @InjectRepository(QuizAttempt) private attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(GradebookCategory) private catRepo: Repository<GradebookCategory>,
    @InjectRepository(GradebookEntry) private entryRepo: Repository<GradebookEntry>,
    @InjectRepository(TeacherEvaluation) private evalRepo: Repository<TeacherEvaluation>,
    @InjectRepository(StudentSurvey) private surveyRepo: Repository<StudentSurvey>,
    @InjectRepository(Group) private groupRepo: Repository<Group>,
  ) {}

  // ─── MODULES ───
  async createModule(dto: any, userId: string) {
    const moduleData: Record<string, any> = {
      description: dto.description,
      group_id: dto.group_id || dto.groupId,
      created_by: userId,
    };

    if ('order' in this.moduleRepo.metadata.propertiesMap) {
      moduleData.order = dto.order_index ?? dto.orderIndex ?? dto.order ?? 1;
    } else if ('order_index' in this.moduleRepo.metadata.propertiesMap) {
      moduleData.order_index = dto.order_index ?? dto.orderIndex ?? dto.order ?? 1;
    }

    if ('title' in this.moduleRepo.metadata.propertiesMap) {
      moduleData.title = dto.title;
    } else {
      moduleData.name = dto.title;
    }

    const module = this.moduleRepo.create(moduleData as Partial<ModuleEntity>);
    return await this.moduleRepo.save(module);
  }

  async findModules(groupId: string) {
    const orderProp = 'order' in this.moduleRepo.metadata.propertiesMap ? 'order' : 'order_index';
    return this.moduleRepo.find({
      where: { group_id: groupId },
      relations: ['lessons', 'lessons.resources'],
      order: { [orderProp]: 'ASC' } as any,
    });
  }

  // ─── LESSONS ───
  async createLesson(dto: any) {
    const lessonData: Record<string, any> = {
      module_id: dto.module_id || dto.moduleId,
      content: dto.content,
    };

    if ('order' in this.lessonRepo.metadata.propertiesMap) {
      lessonData.order = dto.order_index ?? dto.orderIndex ?? dto.order ?? 1;
    } else {
      lessonData.order_index = dto.order_index ?? dto.orderIndex ?? dto.order ?? 1;
    }

    if ('title' in this.lessonRepo.metadata.propertiesMap) {
      lessonData.title = dto.title;
    } else {
      lessonData.name = dto.title;
    }

    const lesson = this.lessonRepo.create(lessonData as Partial<LmsLesson>);
    return await this.lessonRepo.save(lesson);
  }

  async findLessons(moduleId: string) {
    const orderProp = 'order' in this.lessonRepo.metadata.propertiesMap ? 'order' : 'order_index';
    return this.lessonRepo.find({
      where: { module_id: moduleId },
      relations: ['resources'],
      order: { [orderProp]: 'ASC' } as any,
    });
  }

  // ─── RESOURCES ───
  async createResource(dto: any) {
    const resourceData: Record<string, any> = {
      lesson_id: dto.lesson_id || dto.lessonId,
      file_url: dto.file_url || dto.fileUrl || dto.url,
    };

    // Handle title vs name
    if ('title' in this.resourceRepo.metadata.propertiesMap) {
      resourceData.title = dto.title || dto.name;
    } else {
      resourceData.name = dto.title || dto.name;
    }

    // Handle type vs resource_type
    if ('type' in this.resourceRepo.metadata.propertiesMap) {
      resourceData.type = dto.type || dto.resource_type || dto.resourceType;
    } else if ('resource_type' in this.resourceRepo.metadata.propertiesMap) {
      resourceData.resource_type = dto.type || dto.resource_type || dto.resourceType;
    }

    const resource = this.resourceRepo.create(resourceData as Partial<LmsResource>);
    return await this.resourceRepo.save(resource);
  }

  // ─── ASSIGNMENTS ───
  async createAssignment(dto: any, userId: string) {
    const assignment = this.assignmentRepo.create({ ...dto, created_by: userId });
    return this.assignmentRepo.save(assignment);
  }

  async findAssignments(groupId: string) {
    return this.assignmentRepo.find({
      where: { group_id: groupId },
      order: { created_at: 'DESC' },
    });
  }

  async submitAssignment(dto: any, studentId: string) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: dto.assignment_id } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const isLate = assignment.due_at ? new Date() > new Date(assignment.due_at) : false;
    const existing = await this.submissionRepo.findOne({
      where: { assignment_id: dto.assignment_id, student_id: studentId },
    });

    if (existing) {
      existing.content = dto.content;
      existing.file_url = dto.file_url;
      existing.file_name = dto.file_name;
      existing.submitted_at = new Date();
      existing.is_late = isLate;
      existing.status = SubmissionStatus.RESUBMITTED;
      return this.submissionRepo.save(existing);
    }

    const submission = this.submissionRepo.create({
      ...dto,
      student_id: studentId,
      is_late: isLate,
      status: SubmissionStatus.SUBMITTED,
    });
    return this.submissionRepo.save(submission);
  }

  async gradeSubmission(id: string, dto: any, userId: string) {
    const submission = await this.submissionRepo.findOne({ where: { id } });
    if (!submission) throw new NotFoundException('Submission not found');

    submission.grade = dto.grade ?? dto.score;
    submission.feedback = dto.feedback;
    submission.graded_by = userId;
    submission.graded_at = new Date();
    submission.status = SubmissionStatus.GRADED;
    return this.submissionRepo.save(submission);
  }

  // ─── QUIZZES ───
  async createQuiz(dto: any, userId: string) {
    const quiz = this.quizRepo.create({ ...dto, created_by: userId });
    return this.quizRepo.save(quiz);
  }

  async findQuizzes(groupId: string) {
    return this.quizRepo.find({ where: { group_id: groupId } });
  }

  async startAttempt(quizId: string, studentId: string) {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const attemptCount = await this.attemptRepo.count({
      where: { quiz_id: quizId, student_id: studentId },
    });
    if (quiz.max_attempts && attemptCount >= quiz.max_attempts) {
      throw new BadRequestException('Max attempts reached');
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

  async submitAttempt(id: string, answers: any, timeSpent: number) {
    const attempt = await this.attemptRepo.findOne({
      where: { id },
      relations: ['quiz', 'quiz.questions'],
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    let score = 0;
    let totalPoints = 0;
    const gradedAnswers = { ...answers };

    for (const q of attempt.quiz?.questions || []) {
      totalPoints += q.points;
      const userAnswer = answers[q.id];
      if (userAnswer !== undefined) {
        const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(q.correct_answer);
        if (isCorrect) score += q.points;
        gradedAnswers[q.id] = { value: userAnswer, correct: isCorrect, points: isCorrect ? q.points : 0 };
      }
    }

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

    attempt.answers = gradedAnswers;
    attempt.score = score;
    attempt.percentage = parseFloat(percentage.toFixed(2));
    attempt.is_passed = percentage >= (attempt.quiz?.passing_score || 60);
    attempt.submitted_at = new Date();
    attempt.time_spent_seconds = timeSpent;
    attempt.status = AttemptStatus.SUBMITTED;

    return this.attemptRepo.save(attempt);
  }

  // ─── GRADEBOOK ───
  async createCategory(dto: any, userId: string) {
    const cat = this.catRepo.create({ ...dto, created_by: userId });
    return this.catRepo.save(cat);
  }

  async addEntry(dto: any, userId: string) {
    const entry = this.entryRepo.create({ ...dto, created_by: userId });
    return this.entryRepo.save(entry);
  }

  async getGradebook(groupId: string) {
    return this.entryRepo.find({
      where: { group_id: groupId },
      relations: ['student', 'student.user', 'category'],
    });
  }

  // ─── EVALUATIONS & SURVEYS ───
  async createEvaluation(dto: any) {
    return this.evalRepo.save(this.evalRepo.create(dto));
  }

  async createSurvey(dto: any) {
    return this.surveyRepo.save(this.surveyRepo.create(dto));
  }
}