import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItemsController } from './inventory.controller';
import { InventoryItemsService } from './inventory.service';
import { InventoryItem } from '../../shared/entities/inventory-item.entity';
import { StockLevel } from '../../shared/entities/stock-level.entity';
import { StockMove } from '../../shared/entities/stock-move.entity';
import { StudentItemIssue } from '../../shared/entities/student-item-issue.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, StockLevel, StockMove, StudentItemIssue])],
  controllers: [InventoryItemsController],
  providers: [InventoryItemsService],
  exports: [InventoryItemsService],
})
export class InventoryModule {}
