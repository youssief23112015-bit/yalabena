import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { Lead } from '../../shared/entities/lead.entity';
import { LeadActivity } from '../../shared/entities/lead-activity.entity';
import { FollowUp } from '../../shared/entities/follow-up.entity';
import { LeadTag } from '../../shared/entities/lead-tag.entity';
import { LeadTagPivot } from '../../shared/entities/lead-tag-pivot.entity';
import { User } from '../../shared/entities/user.entity';
import { Student } from '../../shared/entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      LeadActivity,
      FollowUp,
      LeadTag,
      LeadTagPivot,
      User,
      Student,
    ]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
