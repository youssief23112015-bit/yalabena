import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestSlot } from '../../shared/entities/test-slot.entity';
import { TestSlotsService } from './test-slots.service';
import { TestSlotsController } from './test-slots.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TestSlot])],
  controllers: [TestSlotsController],
  providers: [TestSlotsService],
  exports: [TestSlotsService], // <--- مهم جداً لكي تستطيع موديولات أخرى استخدامها
})
export class TestSlotsModule {}