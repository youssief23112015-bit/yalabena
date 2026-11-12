import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../shared/entities/course.entity';
import { CoursePrerequisite } from '../../shared/entities/course-prerequisite.entity';
import { CourseMaterial } from '../../shared/entities/course-material.entity';
@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly repo: Repository<Course>,
    @InjectRepository(CoursePrerequisite)
    private readonly prerequisiteRepo: Repository<CoursePrerequisite>,
    @InjectRepository(CourseMaterial)
    private readonly materialRepo: Repository<CourseMaterial>,
  ) {}

  async create(data: Partial<Course>): Promise<Course> {
    const { prerequisites, ...courseData } = data;

    // Save the course first so its generated id is available, keeping
    // prerequisites out of the persisted entity so course_id is never null.
    const course = this.repo.create(courseData);
    const savedCourse = await this.repo.save(course);

    // Persist prerequisites explicitly, always assigning the parent course_id.
    const prereqList = this.normalizePrerequisites(prerequisites);
    if (prereqList.length > 0) {
      const records = prereqList.map((p) =>
        this.prerequisiteRepo.create({
          course_id: savedCourse.id,
          prerequisite_course_id: p.prerequisite_course_id,
          is_strict: p.is_strict ?? true,
        }),
      );
      await this.prerequisiteRepo.save(records);
    }

    return this.findOne(savedCourse.id);
  }

  /**
   * Normalizes the incoming prerequisites payload, dropping empty or
   * unassigned entries so a null course_id can never be persisted.
   */
  private normalizePrerequisites(prerequisites: unknown) {
    if (!Array.isArray(prerequisites)) {
      return [];
    }
    return prerequisites
      .filter(
        (p) => p && (p as any).prerequisite_course_id !== undefined && (p as any).prerequisite_course_id !== null,
      )
      .map((p) => ({
        prerequisite_course_id: (p as any).prerequisite_course_id ?? (p as any).prerequisiteId,
        is_strict: (p as any).is_strict ?? true,
      }));
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
    // Load the real managed entity (findOne() returns a transformed object).
    const course = await this.repo.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    const { prerequisites, ...courseData } = data;
    Object.assign(course, courseData);
    const savedCourse = await this.repo.save(course);

    // Sync prerequisites only when explicitly provided in the payload.
    if (data.prerequisites !== undefined) {
      await this.prerequisiteRepo.delete({ course_id: id });

      const prereqList = this.normalizePrerequisites(prerequisites);
      if (prereqList.length > 0) {
        const records = prereqList.map((p) =>
          this.prerequisiteRepo.create({
            course_id: savedCourse.id,
            prerequisite_course_id: p.prerequisite_course_id,
            is_strict: p.is_strict ?? true,
          }),
        );
        await this.prerequisiteRepo.save(records);
      }
    }

    return this.findOne(savedCourse.id);
  }

  async remove(id: string): Promise<void> {
    const course = await this.repo.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
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

  // ─── Materials (course ↔ inventory item links) ───────────────

  async listMaterials(courseId: string): Promise<CourseMaterial[]> {
    await this.findOne(courseId);
    return this.materialRepo.find({
      where: { course_id: courseId },
      relations: ['inventory_item'],
    });
  }

  async addMaterial(
    courseId: string,
    dto: { inventory_item_id: string; quantity?: number; required?: boolean },
  ): Promise<CourseMaterial> {
    await this.findOne(courseId);
    const existing = await this.materialRepo.findOne({
      where: { course_id: courseId, inventory_item_id: dto.inventory_item_id },
    });
    if (existing) {
      throw new ConflictException('This material is already linked to the course');
    }
    const material = this.materialRepo.create({
      course_id: courseId,
      inventory_item_id: dto.inventory_item_id,
      quantity_per_student: dto.quantity ?? 1,
      is_required: dto.required ?? true,
    });
    return this.materialRepo.save(material);
  }

  async removeMaterial(courseId: string, materialId: string): Promise<{ deleted: true }> {
    const material = await this.materialRepo.findOne({
      where: { id: materialId, course_id: courseId },
    });
    if (!material) {
      throw new NotFoundException('Material not found for this course');
    }
    await this.materialRepo.remove(material);
    return { deleted: true };
  }

}