import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '../../shared/entities/branch.entity';
import { BranchsController } from './branches.controller';
import { BranchsService } from './branches.service';

@Module({
  imports: [TypeOrmModule.forFeature([Branch])],
  controllers: [BranchsController],
  providers: [BranchsService],
  exports: [BranchsService],
})
export class BranchesModule {}