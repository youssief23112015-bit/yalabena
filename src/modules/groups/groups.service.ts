import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../../shared/entities/group.entity';
import { GroupSchedule } from '../../shared/entities/group-schedule.entity';
import { GroupMode } from '../../common/enums/group-mode.enum';
import { GroupStatus } from '../../common/enums/group-status.enum';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly repo: Repository<Group>,
    @InjectRepository(GroupSchedule)
    private readonly scheduleRepo: Repository<GroupSchedule>,
  ) {}

  async create(dto: CreateGroupDto): Promise<Group> {
    const entityData: Partial<Group> = {
      name: dto.name,
      course_id: dto.courseId,
      branch_id: dto.branchId,
      teacher_id: dto.teacherId,
      substitute_teacher_id: dto.substitute_teacher_id || null,
      capacity: dto.capacity,
      mode: dto.mode ? (dto.mode as GroupMode) : GroupMode.IN_PERSON,
      start_date: new Date(dto.start_date),
      end_date: new Date(dto.end_date),
      status: dto.status ? (dto.status as GroupStatus) : GroupStatus.UPCOMING,
    };

    const group = this.repo.create(entityData);
    return this.repo.save(group);
  }

  async findAll(filters: { branchId?: string; courseId?: string }): Promise<Group[]> {
    const query = this.repo.createQueryBuilder('group')
      .leftJoinAndSelect('group.course', 'course')
      .leftJoinAndSelect('group.branch', 'branch')
      .leftJoinAndSelect('group.teacher', 'teacher')
      .leftJoinAndSelect('group.substitute_teacher', 'substituteTeacher');

    if (filters.branchId) {
      query.andWhere('branch.id = :branchId', { branchId: filters.branchId });
    }

    if (filters.courseId) {
      query.andWhere('course.id = :courseId', { courseId: filters.courseId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Group> {
    const group = await this.repo.findOne({
      where: { id },
      relations: ['course', 'branch', 'teacher', 'substitute_teacher', 'schedules'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async update(id: string, dto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);
    
    if (dto.name !== undefined) group.name = dto.name;
    if (dto.courseId !== undefined) group.course_id = dto.courseId;
    if (dto.branchId !== undefined) group.branch_id = dto.branchId;
    if (dto.teacherId !== undefined) group.teacher_id = dto.teacherId;
    if (dto.substitute_teacher_id !== undefined) group.substitute_teacher_id = dto.substitute_teacher_id || null;
    if (dto.capacity !== undefined) group.capacity = dto.capacity;
    if (dto.mode !== undefined) group.mode = dto.mode as GroupMode;
    if (dto.start_date !== undefined) group.start_date = new Date(dto.start_date);
    if (dto.end_date !== undefined) group.end_date = new Date(dto.end_date);
    if (dto.status !== undefined) group.status = dto.status as GroupStatus;

    return this.repo.save(group);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.repo.remove(group);
  }

  async checkConflicts(filters: {
    teacherId?: string;
    classroomId?: string;
    startTime?: string;
    endTime?: string;
    excludeGroupId?: string;
  }): Promise<{ conflicts: boolean; details: string[] }> {
    return { conflicts: false, details: [] };
  }

  async getCalendar(filters: {
    view: 'day' | 'week' | 'month';
    date: string;
    teacherId?: string;
    classroomId?: string;
    branchId?: string;
  }): Promise<Group[]> {
    const query = this.repo.createQueryBuilder('group')
      .leftJoinAndSelect('group.course', 'course')
      .leftJoinAndSelect('group.branch', 'branch')
      .leftJoinAndSelect('group.teacher', 'teacher');

    if (filters.branchId) {
      query.andWhere('group.branch_id = :branchId', { branchId: filters.branchId });
    }

    if (filters.teacherId) {
      query.andWhere('group.teacher_id = :teacherId', { teacherId: filters.teacherId });
    }

    return query.getMany();
  }

  async addSchedule(groupId: string, schedule: any): Promise<GroupSchedule> {
    const group = await this.findOne(groupId);
    const newSchedule = this.scheduleRepo.create({
      group_id: groupId,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      classroom_id: schedule.classroom_id || null,
    });
    return this.scheduleRepo.save(newSchedule);
  }

  async removeSchedule(groupId: string, scheduleId: string): Promise<void> {
    const schedule = await this.scheduleRepo.findOne({ where: { id: scheduleId, group_id: groupId } });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found in group ${groupId}`);
    }
    await this.scheduleRepo.remove(schedule);
  }

  async assignStudent(groupId: string, studentId: string): Promise<any> {
    const group = await this.findOne(groupId);
    
    const result = await this.repo.query(
      `SELECT COUNT(*) as count FROM group_students WHERE group_id = $1 AND status = 'active'`,
      [groupId]
    );
    const currentCount = parseInt(result[0]?.count || '0', 10);
    
    if (currentCount >= group.capacity) {
      throw new BadRequestException('Group capacity exceeded');
    }

    const existing = await this.repo.query(
      `SELECT id FROM group_students WHERE group_id = $1 AND student_id = $2`,
      [groupId, studentId]
    );
    if (existing && existing.length > 0) {
      throw new BadRequestException('Student already assigned to this group');
    }

    await this.repo.query(
      `INSERT INTO group_students (group_id, student_id, status, enrolled_at) VALUES ($1, $2, 'active', NOW())`,
      [groupId, studentId]
    );

    return { group_id: groupId, student_id: studentId, status: 'active' };
  }

  async removeStudent(groupId: string, studentId: string): Promise<void> {
    const result = await this.repo.query(
      `DELETE FROM group_students WHERE group_id = $1 AND student_id = $2 RETURNING id`,
      [groupId, studentId]
    );
    if (!result || result.length === 0) {
      throw new NotFoundException(`Student ${studentId} not found in group ${groupId}`);
    }
  }
}