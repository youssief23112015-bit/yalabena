import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendancesController } from './attendance.controller';
import { AttendancesService } from './attendance.service';
import { Attendance } from '../../shared/entities/attendance.entity';
import { Session } from '../../shared/entities/session.entity';
import { Student } from '../../shared/entities/student.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Session, Student, GroupStudent]),
    // CHAT sync: saving attendance re-syncs the section's (= group's) chat room.
    ChatModule,
  ],
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
