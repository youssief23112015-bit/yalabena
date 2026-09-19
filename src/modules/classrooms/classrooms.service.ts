import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Classroom } from '../../shared/entities/classroom.entity';

@Injectable()
export class ClassroomsService {
  constructor(
    @InjectRepository(Classroom)
    private readonly repo: Repository<Classroom>,
  ) {}

  async create(data: Partial<Classroom>): Promise<Classroom> {
    const classroom = this.repo.create(data);
    return this.repo.save(classroom);
  }

  async findAll(branchId?: string): Promise<Classroom[]> {
    const query = this.repo.createQueryBuilder('classroom')
      .leftJoinAndSelect('classroom.branch', 'branch');

    if (branchId) {
      query.andWhere('branch.id = :branchId', { branchId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Classroom> {
    const classroom = await this.repo.findOne({
      where: { id },
      relations: ['branch'],
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }

    return classroom;
  }

  async update(id: string, data: Partial<Classroom>): Promise<Classroom> {
    const classroom = await this.findOne(id);
    Object.assign(classroom, data);
    return this.repo.save(classroom);
  }

  async remove(id: string): Promise<void> {
    const classroom = await this.findOne(id);
    await this.repo.remove(classroom);
  }
}