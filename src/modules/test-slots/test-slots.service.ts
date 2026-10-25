import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// المسارات الصحيحة بناءً على هيكل مشروعك:
import { TestSlot } from '../../shared/entities/test-slot.entity';
import { CreateSlotDto } from '../placement-tests/dto/create-slot.dto';

@Injectable()
export class TestSlotsService {
  constructor(
    @InjectRepository(TestSlot)
    private readonly testSlotRepository: Repository<TestSlot>,
  ) {}

  async findAll(): Promise<TestSlot[]> {
    return this.testSlotRepository.find({
      relations: ['branch', 'examiner'],
      order: { date: 'ASC', start_time: 'ASC' },
    });
  }

  async findOne(id: string): Promise<TestSlot> {
    const slot = await this.testSlotRepository.findOne({
      where: { id },
      relations: ['branch', 'examiner'],
    });
    if (!slot) {
      throw new NotFoundException(`Test slot with ID ${id} not found`);
    }
    return slot;
  }

  async create(createSlotDto: CreateSlotDto): Promise<TestSlot> {
    const slot = this.testSlotRepository.create(createSlotDto);
    return this.testSlotRepository.save(slot);
  }

  async update(id: string, updateDto: Partial<CreateSlotDto>): Promise<TestSlot> {
    await this.testSlotRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const slot = await this.findOne(id);
    await this.testSlotRepository.remove(slot);
  }
}