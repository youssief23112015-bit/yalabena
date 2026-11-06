import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from '../../shared/entities/lead.entity';
import { Student } from '../../shared/entities/student.entity';
import { Course } from '../../shared/entities/course.entity';
import { Branch } from '../../shared/entities/branch.entity';
import { Group } from '../../shared/entities/group.entity';
import { Session } from '../../shared/entities/session.entity';
import { Invoice } from '../../shared/entities/invoice.entity';
import { Payment } from '../../shared/entities/payment.entity';
import { Attendance } from '../../shared/entities/attendance.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { User } from '../../shared/entities/user.entity';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { Employee } from '../../shared/entities/employee.entity';
import { LeaveRequest } from '../../shared/entities/leave-request.entity';
import { PayrollEntry } from '../../shared/entities/payroll-entry.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { AdminMetricService } from './metrics/admin-metric.service';
import { TeacherMetricService } from './metrics/teacher-metric.service';
import { StudentMetricService } from './metrics/student-metric.service';
import { HrMetricService } from './metrics/hr-metric.service';
import { FinanceMetricService } from './metrics/finance-metric.service';
import { SalesMetricService } from './metrics/sales-metric.service';
import { AcademicMetricService } from './metrics/academic-metric.service';
import { PeriodResolver } from './metrics/period.util';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      Student,
      Course,
      Branch,
      Group,
      Session,
      Invoice,
      Payment,
      Attendance,
      GroupStudent,
      User,
      Enrollment,
      Employee,
      LeaveRequest,
      PayrollEntry,
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    AdminMetricService,
    TeacherMetricService,
    StudentMetricService,
    HrMetricService,
    FinanceMetricService,
    SalesMetricService,
    AcademicMetricService,
    PeriodResolver,
  ],
})
export class DashboardModule {}
