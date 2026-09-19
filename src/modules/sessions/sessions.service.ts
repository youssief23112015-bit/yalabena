import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../shared/entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly repo: Repository<Session>,
  ) {}

  // دالة مساعدة لاستخراج الوقت فقط (HH:mm:ss) من أي DateTime ISO string
  private extractTime(dateTimeStr?: string): string | undefined {
    if (!dateTimeStr) return undefined;
    return dateTimeStr.includes('T') ? dateTimeStr.split('T')[1].substring(0, 8) : dateTimeStr;
  }

  // دالة مساعدة لاستخراج التاريخ فقط (YYYY-MM-DD)
  private extractDate(dateTimeStr?: string): string | undefined {
    if (!dateTimeStr) return undefined;
    return dateTimeStr.includes('T') ? dateTimeStr.split('T')[0] : dateTimeStr;
  }

  async create(data: any): Promise<Session> {
    const rawStartTime = data.start_time || data.startTime;
    const rawEndTime = data.end_time || data.endTime;

    const payload = {
      ...data,
      group_id: data.group_id || data.groupId,
      classroom_id: data.classroom_id || data.classroomId,
      teacher_id: data.teacher_id || data.teacherId,
      date: data.date || this.extractDate(rawStartTime),
      start_time: this.extractTime(rawStartTime),
      end_time: this.extractTime(rawEndTime),
    };

    const session = this.repo.create(payload as Partial<Session>);
    return this.repo.save(session);
  }

  async findAll(groupId?: string): Promise<Session[]> {
    const query = this.repo.createQueryBuilder('session')
      .leftJoinAndSelect('session.group', 'group');

    if (groupId) {
      query.andWhere('group.id = :groupId', { groupId });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.repo.findOne({
      where: { id },
      relations: ['group', 'attendances'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  async update(id: string, data: any): Promise<Session> {
    const session = await this.findOne(id);

    const rawStartTime = data.start_time || data.startTime;
    const rawEndTime = data.end_time || data.endTime;

    const payload = {
      ...data,
      ...(data.groupId || data.group_id ? { group_id: data.group_id || data.groupId } : {}),
      ...(data.classroomId || data.classroom_id ? { classroom_id: data.classroom_id || data.classroomId } : {}),
      ...(data.date || rawStartTime ? { date: data.date || this.extractDate(rawStartTime) } : {}),
      ...(rawStartTime ? { start_time: this.extractTime(rawStartTime) } : {}),
      ...(rawEndTime ? { end_time: this.extractTime(rawEndTime) } : {}),
    };

    Object.assign(session, payload);
    return this.repo.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    await this.repo.remove(session);
  }

  // --- Sub-resource Method ---
  async getAttendance(id: string) {
    const session = await this.repo.findOne({
      where: { id },
      relations: ['attendances'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return (session as any)?.attendances ?? [];
  }
}