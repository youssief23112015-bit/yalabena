import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../../shared/entities/activity.entity';
import { ActivityRegistration } from '../../shared/entities/activity-registration.entity';
import { ActivityPhoto } from '../../shared/entities/activity-photo.entity';
import { RegistrationStatus } from '../../common/enums/registration-status.enum';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity) private repo: Repository<Activity>,
    @InjectRepository(ActivityRegistration) private regRepo: Repository<ActivityRegistration>,
    @InjectRepository(ActivityPhoto) private photoRepo: Repository<ActivityPhoto>,
  ) {}

  async create(dto: any, userId: string) {
    const activity = this.repo.create({ ...dto, created_by: userId });
    return this.repo.save(activity);
  }

  async findAll(query: any, user: any) {
    const qb = this.repo.createQueryBuilder('a')
      .leftJoinAndSelect('a.branch', 'branch');
    if (!user.roles?.includes('super_admin')) {
      qb.andWhere('a.branch_id = :branchId', { branchId: user.branchId });
    }
    if (query.status) qb.andWhere('a.status = :status', { status: query.status });
    if (query.type) qb.andWhere('a.type = :type', { type: query.type });
    return qb.orderBy('a.date', 'DESC').getMany();
  }

  async findOne(id: string) {
    const activity = await this.repo.findOne({
      where: { id },
      relations: ['registrations', 'registrations.student', 'registrations.student.user', 'photos'],
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async register(dto: any) {
    const activity = await this.repo.findOne({ where: { id: dto.activity_id } });
    if (!activity) throw new NotFoundException('Activity not found');

    const count = await this.regRepo.count({ where: { activity_id: dto.activity_id } });
    if (count >= activity.capacity) {
      throw new BadRequestException('Activity is full');
    }

    const existing = await this.regRepo.findOne({
      where: { activity_id: dto.activity_id, student_id: dto.student_id },
    });
    if (existing) throw new BadRequestException('Already registered');

    return this.regRepo.save(this.regRepo.create(dto));
  }

  async addPhoto(dto: any, userId: string) {
    return this.photoRepo.save(this.photoRepo.create({ ...dto, uploaded_by: userId }));
  }
}
