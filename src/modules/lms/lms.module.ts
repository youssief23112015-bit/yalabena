import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LmsModule as LmsModuleEntity } from '../../shared/entities/lms-module.entity';
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
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    LmsModuleEntity, LmsLesson, LmsResource, Assignment, Submission,
    Quiz, QuizQuestion, QuizAttempt, GradebookCategory, GradebookEntry,
    TeacherEvaluation, StudentSurvey, Group, Student,
  ])],
  controllers: [LmsController],
  providers: [LmsService],
  exports: [LmsService],
})
export class LmsModule {}
