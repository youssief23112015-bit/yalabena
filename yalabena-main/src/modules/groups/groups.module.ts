import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../../shared/entities/group.entity';
import { GroupSchedule } from '../../shared/entities/group-schedule.entity';
import { Session } from '../../shared/entities/session.entity';
import { User } from '../../shared/entities/user.entity';
import { Student } from '../../shared/entities/student.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { ChatModule } from '../chat/chat.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupSchedule, Session, User, Student]),
    ChatModule,
    // Direct manual enrollment delegates the ACTIVE enrollment record
    // (level gate, invoice, chat sync) to EnrollmentsService.
    EnrollmentsModule,
    // Group activation generates Sessions through SessionSchedulingService.
    SessionsModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}