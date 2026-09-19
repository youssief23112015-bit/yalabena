import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../../shared/entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchsService {
  constructor(
    @InjectRepository(Branch)
    private readonly repo: Repository<Branch>,
  ) {}

  async create(dto: CreateBranchDto): Promise<Branch> {
    const branch = this.repo.create(dto);
    return this.repo.save(branch);
  }

  async findAll(): Promise<Branch[]> {
    return this.repo.find({
      relations: ['manager'], // Matches the @ManyToOne relation name in branch.entity.ts
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.repo.findOne({
      where: { id },
      relations: ['manager', 'classrooms'], // Matches relation names in branch.entity.ts
    });
    
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    
    return branch;
  }
}