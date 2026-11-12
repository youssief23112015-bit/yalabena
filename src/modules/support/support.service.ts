import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from '../../shared/entities/support-ticket.entity';
import { SupportTicketReply } from '../../shared/entities/support-ticket-reply.entity';
import { User } from '../../shared/entities/user.entity';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketStatusDto } from './dto/update-support-ticket-status.dto';
import { ReplySupportTicketDto } from './dto/reply-support-ticket.dto';
import { SupportTicketQueryDto } from './dto/support-ticket-query.dto';
import { SupportTicketStatus } from '../../common/enums/support-ticket-status.enum';
import { SupportTicketPriority } from '../../common/enums/support-ticket-priority.enum';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly ticketRepo: Repository<SupportTicket>,
    @InjectRepository(SupportTicketReply)
    private readonly replyRepo: Repository<SupportTicketReply>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async createTicket(dto: CreateSupportTicketDto, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    const ticket = this.ticketRepo.create({
      ...dto,
      priority: dto.priority ?? SupportTicketPriority.MEDIUM,
      status: SupportTicketStatus.OPEN,
      user_id: userId,
      user_name: user ? `${user.first_name} ${user.last_name}`.trim() : null,
      user_email: user?.email ?? null,
    });

    return this.ticketRepo.save(ticket);
  }

  async findMyTickets(userId: string) {
    return this.ticketRepo.find({
      where: { user_id: userId },
      relations: ['replies'],
      order: { created_at: 'DESC' },
    });
  }

  async findAll(query: SupportTicketQueryDto, user?: any) {
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.replies', 'replies');

    // Non-staff users can only see their own tickets.
    // Staff roles (super_admin, hr, branch_manager) see all tickets.
    const STAFF_ROLES = ['super_admin', 'hr', 'branch_manager'];
    const isStaff =
      user?.roles?.some((r: string) => STAFF_ROLES.includes(r)) ?? false;

    if (!isStaff && user?.id) {
      qb.andWhere('t.user_id = :userId', { userId: user.id });
    }

    if (query.status) {
      qb.andWhere('t.status = :status', { status: query.status });
    }
    if (query.category) {
      qb.andWhere('t.category ILIKE :category', {
        category: `%${query.category}%`,
      });
    }
    if (query.priority) {
      qb.andWhere('t.priority = :priority', { priority: query.priority });
    }
    if (query.search) {
      qb.andWhere(
        '(t.subject ILIKE :search OR t.message ILIKE :search OR t.user_name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit)
      .take(limit)
      .orderBy('t.created_at', 'DESC');

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['replies'],
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async setStatus(
    id: string,
    dto: UpdateSupportTicketStatusDto,
    adminUserId: string,
  ) {
    const ticket = await this.findOne(id);
    ticket.status = dto.status;
    if (dto.status === SupportTicketStatus.RESOLVED) {
      ticket.resolved_at = new Date();
    }
    return this.ticketRepo.save(ticket);
  }

  async replyTicket(
    ticketId: string,
    dto: ReplySupportTicketDto,
    adminUserId: string,
  ) {
    const ticket = await this.findOne(ticketId);
    const user = await this.userRepo.findOne({ where: { id: adminUserId } });

    const reply = this.replyRepo.create({
      ticket_id: ticketId, // explicit foreign key (NOT NULL column)
      body: dto.body,
      created_by: adminUserId,
      created_by_name: user
        ? `${user.first_name} ${user.last_name}`.trim()
        : null,
    });
    // 1. Persist the reply explicitly first (isolated, no cascade).
    await this.replyRepo.save(reply);

    // 2. Update the parent ticket via a direct UPDATE to avoid cascading
    //    any relation objects (e.g. the loaded `replies` array) that could
    //    trigger a re-insert with a null ticket_id.
    const newStatus =
      ticket.status === SupportTicketStatus.OPEN
        ? SupportTicketStatus.IN_PROGRESS
        : ticket.status;
    await this.ticketRepo.update(ticketId, {
      admin_reply: dto.body,
      replied_by: adminUserId,
      replied_at: new Date(),
      status: newStatus,
    });

    // 3. Notify the ticket creator that an admin replied to their ticket.
    //    Wrapped in try/catch so a notification failure never breaks the reply.
    if (ticket.user_id) {
      try {
        await this.notificationService.notify(ticket.user_id, {
          type: 'support_reply',
          title: 'New reply on your support ticket',
          body: `An admin replied to your issue: ${ticket.subject}`,
          action_url: '/support',
          data: { ticket_id: ticket.id },
        });
      } catch (err) {
        // Non-fatal: log and continue — the reply itself was already saved.
        console.error('Failed to send support reply notification:', err);
      }
    }

    return {
      ...reply,
      created_by_name: reply.created_by_name,
    };
  }

  async assignTicket(
    id: string,
    assignedTo: string,
    adminUserId: string,
  ) {
    const ticket = await this.findOne(id);

    // Validate the assignee exists
    const assignee = await this.userRepo.findOne({ where: { id: assignedTo } });
    if (!assignee) {
      throw new NotFoundException('Assignee not found');
    }

    ticket.assigned_to = assignedTo;
    return this.ticketRepo.save(ticket);
  }
}
