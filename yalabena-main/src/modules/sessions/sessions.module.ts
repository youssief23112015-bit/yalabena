import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../../shared/entities/session.entity';
import { Attendance } from '../../shared/entities/attendance.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupSchedule } from '../../shared/entities/group-schedule.entity';
import { TestSlot } from '../../shared/entities/test-slot.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionSchedulingService } from './scheduling.service';
import { AttendancesModule } from '../attendance/attendance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, Attendance, Group, GroupSchedule, TestSlot]),
    // Reused for QR check-in codes + student self check-in on session routes.
    AttendancesModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionSchedulingService],
  exports: [SessionsService, SessionSchedulingService],
})
export class SessionsModule {}
