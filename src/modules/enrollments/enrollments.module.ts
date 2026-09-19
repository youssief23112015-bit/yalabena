import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { Student } from '../../shared/entities/student.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { Waitlist } from '../../shared/entities/waitlist.entity';
import { Invoice } from '../../shared/entities/invoice.entity';
import { PromoCode } from '../../shared/entities/promo-code.entity';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, Student, Group, GroupStudent, Waitlist, Invoice, PromoCode])],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
