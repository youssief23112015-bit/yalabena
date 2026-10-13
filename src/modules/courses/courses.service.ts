import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../shared/entities/course.entity';
import { CoursePrerequisite } from '../../shared/entities/course-prerequisite.entity';
import { CourseMaterial } from '../../shared/entities/course-material.entity';
import { CourseBranchPricing } from '../../shared/entities/course-branch-pricing.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly repo: Repository<Course>,
    @InjectRepository(CoursePrerequisite)
    private readonly prerequisiteRepo: Repository<CoursePrerequisite>,
    @InjectRepository(CourseMaterial)
    private readonly materialRepo: Repository<CourseMaterial>,
    @InjectRepository(CourseBranchPricing)
    private readonly branchPricingRepo: Repository<CourseBranchPricing>,
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

  // ─── Per-branch pricing overrides ─────────────────────────────

  async listBranchPricing(courseId: string): Promise<CourseBranchPricing[]> {
    await this.findOne(courseId);
    return this.branchPricingRepo.find({
      where: { course_id: courseId },
      relations: ['branch'],
    });
  }

  async setBranchPricing(
    courseId: string,
    dto: { branch_id: string; price: number },
  ): Promise<CourseBranchPricing> {
    await this.findOne(courseId);
    const existing = await this.branchPricingRepo.findOne({
      where: { course_id: courseId, branch_id: dto.branch_id },
    });
    if (existing) {
      existing.price = dto.price;
      return this.branchPricingRepo.save(existing);
    }
    const pricing = this.branchPricingRepo.create({
      course_id: courseId,
      branch_id: dto.branch_id,
      price: dto.price,
    });
    return this.branchPricingRepo.save(pricing);
  }
}