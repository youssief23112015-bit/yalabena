import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { Course } from '../../shared/entities/course.entity';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, Student, Group, Course]), FinanceModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
