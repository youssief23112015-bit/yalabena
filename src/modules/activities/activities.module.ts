import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../../shared/entities/activity.entity';
import { ActivityRegistration } from '../../shared/entities/activity-registration.entity';
import { ActivityPhoto } from '../../shared/entities/activity-photo.entity';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityRegistration, ActivityPhoto])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
