import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitlistsController } from './waitlists.controller';
import { WaitlistsService } from './waitlists.service';
import { Waitlist } from '../../shared/entities/waitlist.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Waitlist, Group, GroupStudent])],
  controllers: [WaitlistsController],
  providers: [WaitlistsService],
  exports: [WaitlistsService],
})
export class WaitlistsModule {}
