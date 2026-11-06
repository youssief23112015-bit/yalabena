import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlacementTestsService } from './placement-tests.service';
import { PlacementTestsController } from './placement-tests.controller';
import { PlacementTest } from '../../shared/entities/placement-test.entity';
import { TestQuestion } from '../../shared/entities/test-question.entity';
import { PlacementTestAnswer } from '../../shared/entities/placement-test-answer.entity';
import { Lead } from '../../shared/entities/lead.entity';
import { Student } from '../../shared/entities/student.entity';
import { User } from '../../shared/entities/user.entity';
import { TestSlot } from '../../shared/entities/test-slot.entity';
import { TestSlotsModule } from '../test-slots/test-slots.module'; // <--- قم بالاستيراد هنا

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlacementTest,
      TestQuestion,
      PlacementTestAnswer,
      Lead,
      Student,
      User,
      TestSlot,
    ]),
    TestSlotsModule, // <--- أضفها هنا
  ],
  controllers: [PlacementTestsController],
  providers: [PlacementTestsService],
  exports: [PlacementTestsService],
})
export class PlacementTestsModule {}