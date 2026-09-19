import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../shared/entities/course.entity';
import { CoursePrerequisite } from '../../shared/entities/course-prerequisite.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly repo: Repository<Course>,
    @InjectRepository(CoursePrerequisite)
    private readonly prerequisiteRepo: Repository<CoursePrerequisite>,
  ) {}

  async create(data: Partial<Course>): Promise<Course> {
    const course = this.repo.create(data);
    return this.repo.save(course);
  }

  async findAll(): Promise<Course[]> {
    return this.repo.find({ relations: ['materials'] });
  }

  async findOne(id: string): Promise<any> {
    const course = await this.repo.findOne({
      where: { id },
      relations: ['materials'],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    const prerequisitesRecords = await this.prerequisiteRepo.find({
      where: { course_id: id },
      relations: ['prerequisite_course'],
    });

    return {
      ...course,
      prerequisites: prerequisitesRecords.map((p) => ({
        ...p.prerequisite_course,
        is_strict: p.is_strict,
      })),
    };
  }

  async update(id: string, data: Partial<Course>): Promise<Course> {
    const course = await this.findOne(id);
    Object.assign(course, data);
    return this.repo.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.repo.remove(course);
  }

  async addPrerequisite(courseId: string, prerequisiteCourseId: string, isStrict: boolean = true): Promise<any> {
    await this.findOne(courseId);
    await this.findOne(prerequisiteCourseId);

    const existing = await this.prerequisiteRepo.findOne({
      where: { course_id: courseId, prerequisite_course_id: prerequisiteCourseId },
    });

    if (existing) {
      throw new ConflictException(`Prerequisite relation already exists`);
    }

    const prerequisiteRecord = this.prerequisiteRepo.create({
      course_id: courseId,
      prerequisite_course_id: prerequisiteCourseId,
      is_strict: isStrict,
    });

    await this.prerequisiteRepo.save(prerequisiteRecord);
    return this.findOne(courseId);
  }

  async removePrerequisite(courseId: string, prerequisiteCourseId: string): Promise<any> {
    const record = await this.prerequisiteRepo.findOne({
      where: { course_id: courseId, prerequisite_course_id: prerequisiteCourseId },
    });

    if (!record) {
      throw new NotFoundException(`Prerequisite relation not found`);
    }

    await this.prerequisiteRepo.remove(record);
    return this.findOne(courseId);
  }
}