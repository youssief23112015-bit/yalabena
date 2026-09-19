import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from '../../shared/entities/lead.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { Session } from '../../shared/entities/session.entity';
import { Attendance } from '../../shared/entities/attendance.entity';
import { Invoice } from '../../shared/entities/invoice.entity';
import { Payment } from '../../shared/entities/payment.entity';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    Lead, Student, Group, GroupStudent, Session, Attendance, Invoice, Payment, Enrollment,
  ])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
