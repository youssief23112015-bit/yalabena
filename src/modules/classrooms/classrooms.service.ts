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

  async findAll(): Promise<Classroom[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Classroom> {
    const classroom = await this.repo.findOne({
      where: { id },
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