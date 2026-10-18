import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../../shared/entities/group.entity';
import { GroupSchedule } from '../../shared/entities/group-schedule.entity';
import { User } from '../../shared/entities/user.entity';
import { Student } from '../../shared/entities/student.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { ChatModule } from '../chat/chat.module';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupSchedule, User, Student]),
    ChatModule,
    // Direct manual enrollment delegates the ACTIVE enrollment record
    // (level gate, invoice, chat sync) to EnrollmentsService.
    EnrollmentsModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}