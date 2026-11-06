import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '../../shared/entities/employee.entity';
import { EmployeeDocument } from '../../shared/entities/employee-document.entity';
import { TeacherAvailability } from '../../shared/entities/teacher-availability.entity';
import { LeaveRequest } from '../../shared/entities/leave-request.entity';
import { PayrollPeriod } from '../../shared/entities/payroll-period.entity';
import { PayrollEntry } from '../../shared/entities/payroll-entry.entity';
import { Session } from '../../shared/entities/session.entity';
import { User } from '../../shared/entities/user.entity';
import { Group } from '../../shared/entities/group.entity';
import { Student } from '../../shared/entities/student.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { Lead } from '../../shared/entities/lead.entity';
import { SalesTarget } from '../../shared/entities/sales-target.entity';
import { TeacherEvaluation } from '../../shared/entities/teacher-evaluation.entity';
import { LmsModule as LmsModuleEntity } from '../../shared/entities/lms-module.entity';
import { LmsLesson } from '../../shared/entities/lms-lesson.entity';
import { LmsResource } from '../../shared/entities/lms-resource.entity';
import { LmsLessonProgress } from '../../shared/entities/lms-lesson-progress.entity';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee, EmployeeDocument, TeacherAvailability, LeaveRequest,
      PayrollPeriod, PayrollEntry, Session, User,
      Group, Student, GroupStudent, Enrollment, Lead, SalesTarget,
      TeacherEvaluation, LmsModuleEntity, LmsLesson, LmsResource,
      LmsLessonProgress,
    ]),
    SessionsModule,
  ],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
