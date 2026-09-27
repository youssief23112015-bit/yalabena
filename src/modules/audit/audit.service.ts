import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../shared/entities/audit-log.entity';
import { ActorType } from '../../common/enums/actor-type.enum';

export interface AuditEntry {
  actor_id?: string | null;
  actor_type?: ActorType;
  action: string;            // e.g. "POST /finance/payments" or "hr.leave.approve"
  module: string;            // e.g. "finance"
  target_type: string;       // e.g. "http_request" or entity name
  target_id?: string | null; // uuid when known
  before_state?: any;
  after_state?: any;
  description?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

export interface AuditQuery {
  module?: string;
  action?: string;
  actor_id?: string;
  target_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /**
   * Fire-and-forget audit write (SRS 7.2): never throws, never blocks the
   * business operation that triggered it.
   */
  log(entry: AuditEntry): void {
    this.repo
      .save(
        this.repo.create({
          actor_id: entry.actor_id ?? null,
          actor_type: entry.actor_type ?? ActorType.USER,
          action: entry.action.substring(0, 100),
          module: entry.module.substring(0, 50),
          target_type: entry.target_type.substring(0, 50),
          target_id: entry.target_id ?? null,
          before_state: entry.before_state ?? null,
          after_state: entry.after_state ?? null,
          description: entry.description ?? null,
          ip_address: entry.ip_address ?? null,
          user_agent: entry.user_agent ?? null,
          session_id: entry.session_id ?? null,
        }),
      )
      .catch((err) =>
        this.logger.warn(`Audit write failed (${entry.action}): ${err.message}`),
      );
  }

  async findAll(q: AuditQuery) {
    const page = Math.max(1, Number(q.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 25));

    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.actor', 'actor')
      .orderBy('a.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q.module) qb.andWhere('a.module = :module', { module: q.module });
    if (q.action) qb.andWhere('a.action ILIKE :action', { action: `%${q.action}%` });
    if (q.actor_id) qb.andWhere('a.actor_id = :actorId', { actorId: q.actor_id });
    if (q.target_id) qb.andWhere('a.target_id = :targetId', { targetId: q.target_id });
    if (q.date_from) qb.andWhere('a.created_at >= :from', { from: q.date_from });
    if (q.date_to) qb.andWhere('a.created_at <= :to', { to: q.date_to });

    const [items, total] = await qb.getManyAndCount();
    return { data: items, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}
