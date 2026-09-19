import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Lead } from '../../shared/entities/lead.entity';
import { LeadActivity } from '../../shared/entities/lead-activity.entity';
import { FollowUp } from '../../shared/entities/follow-up.entity';
import { LeadTag } from '../../shared/entities/lead-tag.entity';
import { LeadTagPivot } from '../../shared/entities/lead-tag-pivot.entity';
import { User } from '../../shared/entities/user.entity';
import { Student } from '../../shared/entities/student.entity';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { ActivityType } from '../../common/enums/activity-type.enum';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { AddActivityDto } from './dto/add-activity.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { AddTagDto } from './dto/add-tag.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead) private readonly repo: Repository<Lead>,
    @InjectRepository(LeadActivity) private readonly activityRepo: Repository<LeadActivity>,
    @InjectRepository(FollowUp) private readonly followUpRepo: Repository<FollowUp>,
    @InjectRepository(LeadTag) private readonly tagRepo: Repository<LeadTag>,
    @InjectRepository(LeadTagPivot) private readonly tagPivotRepo: Repository<LeadTagPivot>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
  ) {}

  // ---------- queries ----------

  async findAll(query: LeadQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);

    const qb = this.repo.createQueryBuilder('lead')
      .leftJoinAndSelect('lead.branch', 'branch')
      // ✅ FIXED: Use the TypeScript entity property name 'assigned_agent', 
      // NOT the database column name 'assigned_to'
      .leftJoinAndSelect('lead.assigned_agent', 'assigned_agent') 
      .orderBy('lead.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.andWhere(
        '(lead.first_name ILIKE :search OR lead.last_name ILIKE :search OR lead.phone ILIKE :search OR lead.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.status) qb.andWhere('lead.status = :status', { status: query.status });
    if (query.source) qb.andWhere('lead.source = :source', { source: query.source });
    if (query.branch_id) qb.andWhere('lead.branch_id = :branchId', { branchId: query.branch_id });
    if (query.assigned_to) qb.andWhere('lead.assigned_to = :assignedTo', { assignedTo: query.assigned_to });
    if (query.level_interest) qb.andWhere('lead.level_interest = :level', { level: query.level_interest });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const lead = await this.repo.findOne({
      where: { id },
      // ✅ FIXED: Use 'assigned_agent' for relations
      relations: [
        'branch', 
        'assigned_agent', 
        'activities', 
        'activities.created_by', 
        'follow_ups', 
        'follow_ups.assigned_agent' // ✅ FIXED: FollowUp entity also uses 'assigned_agent'
      ],
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    const tagPivots = await this.tagPivotRepo.find({
      where: { lead_id: id },
      relations: ['tag'],
    });
    return { ...lead, tags: tagPivots.map((p) => p.tag) };
  }

  // ---------- create / update with duplicate detection ----------

  async create(dto: CreateLeadDto) {
    const duplicate = await this.findDuplicate(dto.phone, dto.email, dto.national_id);
    if (duplicate) {
      throw new ConflictException({
        message: 'A lead with the same phone, email, or national ID already exists.',
        existing_lead_id: duplicate.id,
      });
    }
    const lead = this.repo.create(dto as Partial<Lead>);
    return this.repo.save(lead);
  }

  private async findDuplicate(phone: string, email?: string, nationalId?: string): Promise<Lead | null> {
    const qb = this.repo.createQueryBuilder('lead').where('lead.phone = :phone', { phone });
    if (email) qb.orWhere('lead.email = :email', { email });
    if (nationalId) qb.orWhere('lead.national_id = :nationalId', { nationalId });
    return qb.getOne();
  }

  async update(id: string, dto: UpdateLeadDto, userId?: string) {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    if (dto.status && dto.status !== lead.status) {
      await this.logActivity(id, {
        type: ActivityType.STATUS_CHANGE,
        note: `Status changed from ${lead.status} to ${dto.status}`,
        old_status: lead.status,
        new_status: dto.status,
      } as any, userId);
    }

    Object.assign(lead, dto);
    return this.repo.save(lead);
  }

  // ---------- assignment ----------

  async assign(id: string, agentId: string, userId?: string) {
    const lead = await this.findOne(id);
    const agent = await this.userRepo.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException(`User with ID ${agentId} not found`);
    }
    lead.assigned_to = agentId; // DB column assignment is fine here
    const saved = await this.repo.save(lead);
    await this.logActivity(id, { 
      type: ActivityType.NOTE, 
      note: `Assigned to ${agent.first_name} ${agent.last_name}` 
    } as any, userId);
    return saved;
  }

  async autoAssign(id: string, branchId?: string) {
    const candidates = await this.userRepo.find({
      where: branchId ? { branch_id: branchId } : {},
      order: { created_at: 'ASC' },
    });
    
    const active = candidates.filter((u: any) => u.status !== 'suspended' && u.status !== 'inactive');
    if (!active.length) {
      throw new BadRequestException('No available users to assign this lead to.');
    }

    const counts = await this.repo.createQueryBuilder('lead')
      .select('lead.assigned_to', 'user_id')
      .addSelect('COUNT(lead.id)', 'cnt')
      .where('lead.assigned_to IN (:...ids)', { ids: active.map((u) => u.id) })
      .groupBy('lead.assigned_to')
      .getRawMany();
      
    const countMap = new Map(counts.map((c: any) => [c.user_id, Number(c.cnt)]));
    const leastLoaded = active.sort((a, b) => (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0))[0];
    
    return this.assign(id, leastLoaded.id);
  }

  // ---------- conversion ----------

  async convert(id: string, dto: ConvertLeadDto, userId?: string) {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException(`Lead with ID ${id} not found`);
    if (lead.converted_to_student_id) throw new ConflictException('This lead has already been converted.');

    const tempPassword = await bcrypt.hash(Math.random().toString(36).slice(-12), 10);
    const user = await this.userRepo.save(
      this.userRepo.create({
        email: lead.email ?? `lead.${lead.id.slice(0, 8)}@placeholder.speakup.local`,
        phone: lead.phone,
        first_name: lead.first_name,
        last_name: lead.last_name,
        password_hash: tempPassword,
        language: 'ar',
        branch_id: dto.branch_id ?? lead.branch_id,
      } as Partial<User>),
    );

    // DB-FIRST COMPLIANCE: student_number is auto-generated by the 'trg_students_number' trigger.
    const student = await this.studentRepo.save(
      this.studentRepo.create({
        user_id: user.id,
        current_level: dto.level ?? lead.level_interest,
        branch_id: dto.branch_id ?? lead.branch_id,
        enrollment_date: new Date(),
      } as Partial<Student>),
    );

    lead.converted_to_student_id = student.id;
    lead.converted_at = new Date();
    lead.status = LeadStatus.ENROLLED;
    await this.repo.save(lead);
    
    await this.logActivity(id, { 
      type: ActivityType.STATUS_CHANGE, 
      note: `Converted to student`,
      old_status: lead.status,
      new_status: LeadStatus.ENROLLED
    } as any, userId);

    return { lead, student, user: { id: user.id, email: user.email } };
  }

  // ---------- activities / follow-ups / tags ----------

  private async logActivity(leadId: string, data: Partial<LeadActivity>, userId?: string) {
    return this.activityRepo.save(
      this.activityRepo.create({ lead_id: leadId, created_by: userId ?? null, ...data }),
    );
  }

  async addActivity(id: string, dto: AddActivityDto, userId?: string) {
    await this.findOne(id);
    return this.logActivity(id, {
      type: dto.type as ActivityType,
      note: dto.note ?? null,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : null,
    }, userId);
  }

  async listActivities(id: string) {
    await this.findOne(id);
    return this.activityRepo.find({
      where: { lead_id: id },
      relations: ['created_by'],
      order: { created_at: 'DESC' },
    });
  }

  async createFollowUp(id: string, dto: CreateFollowUpDto) {
    await this.findOne(id);
    return this.followUpRepo.save(
      this.followUpRepo.create({
        lead_id: id,
        assigned_to: dto.assigned_to, // DB column assignment
        due_date: new Date(dto.due_date),
        note: dto.note ?? null,
      }),
    );
  }

  async listFollowUps(id: string) {
    await this.findOne(id);
    return this.followUpRepo.find({
      where: { lead_id: id },
      // ✅ FIXED: Use 'assigned_agent' for the FollowUp entity relation
      relations: ['assigned_agent'], 
      order: { due_date: 'ASC' },
    });
  }

  async completeFollowUp(followUpId: string) {
    const followUp = await this.followUpRepo.findOne({ where: { id: followUpId } });
    if (!followUp) throw new NotFoundException(`Follow-up with ID ${followUpId} not found`);
    
    followUp.status = 'completed' as any;
    followUp.completed_at = new Date();
    return this.followUpRepo.save(followUp);
  }

  async addTag(id: string, dto: AddTagDto) {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException(`Lead with ID ${id} not found`);

    let tag = await this.tagRepo.findOne({ where: { name: dto.name } });
    if (!tag) {
      tag = await this.tagRepo.save(
        this.tagRepo.create({ name: dto.name, color: dto.color ?? '#000000', branch_id: lead.branch_id }),
      );
    }

    const existing = await this.tagPivotRepo.findOne({ where: { lead_id: id, tag_id: tag.id } });
    if (!existing) {
      await this.tagPivotRepo.save(this.tagPivotRepo.create({ lead_id: id, tag_id: tag.id }));
    }
    return { tag, attached: !existing };
  }

  async removeTag(id: string, tagId: string) {
    await this.findOne(id);
    await this.tagPivotRepo.delete({ lead_id: id, tag_id: tagId });
    return { removed: true };
  }

  // ---------- pipeline & source reporting ----------

  async pipeline() {
    const rows = await this.repo.createQueryBuilder('lead')
      .select('lead.status', 'status')
      .addSelect('COUNT(lead.id)', 'count')
      .groupBy('lead.status')
      .getRawMany();
    return rows.map((r: any) => ({ status: r.status, count: Number(r.count) }));
  }

  async sourceReport() {
    const rows = await this.repo.createQueryBuilder('lead')
      .select('lead.source', 'source')
      .addSelect('COUNT(lead.id)', 'count')
      .groupBy('lead.source')
      .getRawMany();
    return rows.map((r: any) => ({ source: r.source, count: Number(r.count) }));
  }

  async overdueFollowUps() {
    return this.followUpRepo.createQueryBuilder('follow_up')
      .leftJoinAndSelect('follow_up.lead', 'lead')
      // ✅ FIXED: Use 'assigned_agent' for the FollowUp entity relation
      .leftJoinAndSelect('follow_up.assigned_agent', 'assigned_agent') 
      .where('follow_up.status = :status', { status: 'pending' })
      .andWhere('follow_up.due_date < NOW()')
      .orderBy('follow_up.due_date', 'ASC')
      .getMany();
  }
}