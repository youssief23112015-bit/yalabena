import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../../shared/entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

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

  async update(id: string, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);
    Object.assign(branch, dto);
    return this.repo.save(branch);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const branch = await this.findOne(id);
    // Link-check: refuse if students/enrollments still point at this branch.
    const linkedStudents = await this.repo.manager
      .getRepository('Student')
      .count({ where: { branch_id: branch.id } })
      .catch(() => 0);
    if (linkedStudents > 0) {
      throw new ConflictException(
        `Branch still has ${linkedStudents} student(s) — move them before deleting`,
      );
    }
    await this.repo.remove(branch);
    return { id, deleted: true };
  }
}