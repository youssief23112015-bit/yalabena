import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlacementTest } from '../../shared/entities/placement-test.entity';
import { TestQuestion } from '../../shared/entities/test-question.entity';
import { PlacementTestAnswer } from '../../shared/entities/placement-test-answer.entity';
import { PlacementTestsController } from './placement-tests.controller';
import { PlacementTestsService } from './placement-tests.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlacementTest, TestQuestion, PlacementTestAnswer])],
  controllers: [PlacementTestsController],
  providers: [PlacementTestsService],
  exports: [PlacementTestsService],
})
export class PlacementTestsModule {}