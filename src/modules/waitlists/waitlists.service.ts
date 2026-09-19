import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Waitlist } from '../../shared/entities/waitlist.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';

@Injectable()
export class WaitlistsService {
  constructor(
    @InjectRepository(Waitlist)
    private readonly repo: Repository<Waitlist>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(GroupStudent)
    private readonly groupStudentRepo: Repository<GroupStudent>,
  ) {}

  async create(data: Partial<Waitlist>): Promise<Waitlist> {
    const entry = this.repo.create(data);
    return this.repo.save(entry);
  }

  async findAll(filters: { branchId?: string; level?: string; status?: string; courseId?: string }): Promise<Waitlist[]> {
    const query = this.repo.createQueryBuilder('waitlist')
      .leftJoinAndSelect('waitlist.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('waitlist.branch', 'branch')
      .leftJoinAndSelect('waitlist.course', 'course')
      .orderBy('waitlist.priority', 'DESC')
      .addOrderBy('waitlist.created_at', 'ASC');

    if (filters.branchId) query.andWhere('waitlist.branch_id = :branchId', { branchId: filters.branchId });
    if (filters.level) query.andWhere('waitlist.level = :level', { level: filters.level });
    if (filters.status) query.andWhere('waitlist.status = :status', { status: filters.status });
    if (filters.courseId) query.andWhere('waitlist.course_id = :courseId', { courseId: filters.courseId });

    return query.getMany();
  }

  async findOne(id: string): Promise<Waitlist> {
    const entry = await this.repo.findOne({
      where: { id },
      relations: ['student', 'student.user', 'branch', 'course'],
    });
    if (!entry) {
      throw new NotFoundException(`Waitlist entry with ID ${id} not found`);
    }
    return entry;
  }

  /** SRS 4.4 — move a waitlisted student into a group (hard capacity stop). */
  async assignToGroup(waitlistId: string, groupId: string, enrolledBy?: string) {
    const entry = await this.findOne(waitlistId);
    if (entry.status === 'enrolled') {
      throw new ConflictException('This student has already been enrolled from the waitlist.');
    }

    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    const currentCount = await this.groupStudentRepo.count({
      where: { group_id: groupId, status: 'active' },
    });
    if (currentCount >= group.capacity) {
      throw new BadRequestException(`Group is full (${currentCount}/${group.capacity}). Increase capacity or pick another group.`);
    }

    const existing = await this.groupStudentRepo.findOne({
      where: { group_id: groupId, student_id: entry.student_id },
    });
    if (!existing) {
      await this.groupStudentRepo.save(
        this.groupStudentRepo.create({
          group_id: groupId,
          student_id: entry.student_id,
          enrolled_by: enrolledBy ?? null,
        }),
      );
    }

    entry.status = 'enrolled';
    entry.enrolled_at = new Date();
    await this.repo.save(entry);

    return { waitlist: entry, group, group_size: currentCount + 1 };
  }

  async bulkAssignToGroup(waitlistIds: string[], groupId: string, enrolledBy?: string) {
    const results = { enrolled: [] as any[], failed: [] as any[] };
    for (const id of waitlistIds) {
      try {
        results.enrolled.push(await this.assignToGroup(id, groupId, enrolledBy));
      } catch (err) {
        results.failed.push({ waitlist_id: id, reason: (err as Error).message });
      }
    }
    return results;
  }

  /** Alert when enough students are waiting to justify opening a new class. */
  async thresholdReport(threshold = 8) {
    const rows = await this.repo.createQueryBuilder('waitlist')
      .select('waitlist.level', 'level')
      .addSelect('waitlist.branch_id', 'branch_id')
      .addSelect('COUNT(waitlist.id)', 'waiting')
      .where("waitlist.status = 'waiting'")
      .groupBy('waitlist.level')
      .addGroupBy('waitlist.branch_id')
      .having('COUNT(waitlist.id) >= :threshold', { threshold })
      .getRawMany();
    return { threshold, ready_to_open: rows.map((r) => ({ ...r, waiting: Number(r.waiting) })) };
  }

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);
    await this.repo.remove(entry);
  }
}
