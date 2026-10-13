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
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

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
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
