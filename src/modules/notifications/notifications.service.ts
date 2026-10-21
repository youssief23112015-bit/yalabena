import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../shared/entities/notification.entity';
import { User } from '../../shared/entities/user.entity';
import { Group } from '../../shared/entities/group.entity';
import { UserStatus } from '../../common/enums/user-status.enum';
import {
  BroadcastTargetType,
  SendBroadcastDto,
} from './dto/broadcast-notification.dto';
import type { AuthUser } from '../../common/utils/auth-user';
import { NotificationsGateway } from './notifications.gateway';

export interface NotificationQuery {
  page?: number;
  limit?: number;
  unread_only?: boolean;
}

/** How many notification rows a single broadcast insert handles per batch. */
const BROADCAST_CHUNK_SIZE = 500;

/** Roles that keep full targeting power even if they also hold `teacher`. */
const ADMIN_TARGETING_ROLES = [
  'super_admin',
  'admin',
  'hr',
  'academic',
];

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Persist a notification and push it over the realtime socket (no-op if the
   * user is offline). Used by other modules and by the REST endpoints below.
   */
  async notify(
    userId: string,
    payload: { type: string; title: string; body: string; data?: Record<string, unknown>; action_url?: string },
  ): Promise<Notification> {
    const notification = await this.repo.save(
      this.repo.create({
        user_id: userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? null,
        action_url: payload.action_url ?? null,
      }),
    );
    this.gateway.sendToUser(userId, notification);
    return notification;
  }

  /** Paginated inbox for one user, newest first, with an unread count. */
  async findAll(userId: string, query: NotificationQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .orderBy('n.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.unread_only) {
      qb.andWhere('n.read_at IS NULL');
    }

    const [items, total] = await qb.getManyAndCount();
    const unread_count = await this.repo
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.read_at IS NULL')
      .getCount();

    return { items, total, page, limit, unread_count };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.repo
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.read_at IS NULL')
      .getCount();
    return { count };
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification || notification.user_id !== userId) {
      throw new NotFoundException('Notification not found');
    }
    if (!notification.read_at) {
      notification.read_at = new Date();
      await this.repo.save(notification);
    }
    return notification;
  }

  async markAllRead(userId: string): Promise<{ marked: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .update(Notification)
      .set({ read_at: () => 'NOW()' })
      .where('user_id = :userId', { userId })
      .andWhere('read_at IS NULL')
      .execute();
    return { marked: result.affected ?? 0 };
  }

  /**
   * Broadcast (SRS 4.18 + targeting Business Rules 1–2).
   *
   * Security:
   *  - Admin-like senders may target everything (`all`, `students`,
   *    `teachers`, `specific_user`, `group`).
   *  - Teachers (without an admin role) may ONLY target `group`, and only a
   *    group whose `teacher_id` is the sender — anything else → 403.
   *
   * Rows are inserted in chunks and then pushed over the realtime gateway so
   * online recipients see the notification without a refresh.
   */
  async createBroadcast(
    dto: SendBroadcastDto,
    sender?: AuthUser,
  ): Promise<{ sent: number; target_type: string; target_role?: string }> {
    const targetType = this.resolveTargetType(dto);
    const senderRoles = (sender?.roles ?? []).map((r) => String(r).toLowerCase());
    const isTeacherSender = senderRoles.includes('teacher');
    const isAdminLike = senderRoles.some((r) => ADMIN_TARGETING_ROLES.includes(r));

    // Business Rule 2 — teachers cannot broadcast to all users/students.
    if (isTeacherSender && !isAdminLike && targetType !== 'group') {
      throw new ForbiddenException(
        'Teachers may only send notifications to students of their own groups',
      );
    }

    const userIds = await this.resolveRecipientIds(targetType, dto, {
      isTeacherSender,
      isAdminLike,
      senderId: sender?.id,
    });

    const data: Record<string, unknown> = { target_type: targetType };
    if (dto.group_id) data.group_id = dto.group_id;
    if (dto.target_user_id) data.target_user_id = dto.target_user_id;
    if (dto.target_role) data.legacy_target_role = dto.target_role;

    const saved: Notification[] = [];
    for (let i = 0; i < userIds.length; i += BROADCAST_CHUNK_SIZE) {
      const chunk = userIds.slice(i, i + BROADCAST_CHUNK_SIZE);
      const entities = chunk.map((userId) =>
        this.repo.create({
          user_id: userId,
          type: 'broadcast',
          title: dto.title,
          body: dto.message,
          data,
        }),
      );
      saved.push(...(await this.repo.save(entities)));
    }

    for (const notification of saved) {
      this.gateway.sendToUser(notification.user_id, notification);
    }

    const result: { sent: number; target_type: string; target_role?: string } = {
      sent: saved.length,
      target_type: targetType,
    };
    if (dto.target_role) result.target_role = dto.target_role;
    return result;
  }

  /** target_type wins; legacy target_role is translated; default is 'all'. */
  private resolveTargetType(dto: SendBroadcastDto): BroadcastTargetType | string {
    if (dto.target_type) return dto.target_type;
    switch (dto.target_role) {
      case 'student':
        return 'students';
      case 'teacher':
        return 'teachers';
      case 'hr':
        // Legacy audience with no target_type equivalent — resolved as the
        // raw 'hr' role slug in resolveRecipientIds below.
        return 'hr';
      case 'all':
      default:
        return 'all';
    }
  }

  /** Resolves the concrete recipient user ids for a broadcast. */
  private async resolveRecipientIds(
    targetType: BroadcastTargetType | string,
    dto: SendBroadcastDto,
    senderCtx: { isTeacherSender: boolean; isAdminLike: boolean; senderId?: string },
  ): Promise<string[]> {
    switch (targetType) {
      case 'specific_user': {
        if (!dto.target_user_id) {
          throw new BadRequestException('target_user_id is required for specific_user targeting');
        }
        const target = await this.userRepo.findOne({ where: { id: dto.target_user_id } });
        if (!target) throw new NotFoundException('Target user not found');
        return [target.id];
      }

      case 'group': {
        if (!dto.group_id) {
          throw new BadRequestException('group_id is required for group targeting');
        }
        const group = await this.groupRepo.findOne({ where: { id: dto.group_id } });
        if (!group) throw new NotFoundException('Group not found');
        // Business Rule 2 — a teacher may only notify their OWN group.
        if (
          senderCtx.isTeacherSender &&
          !senderCtx.isAdminLike &&
          group.teacher_id !== senderCtx.senderId
        ) {
          throw new ForbiddenException('You are not the assigned teacher of this group');
        }
        return this.groupRosterIds(group.id);
      }

      case 'students':
        return this.roleRecipientIds('student');

      case 'teachers':
        return this.roleRecipientIds('teacher');

      case 'all':
        return this.roleRecipientIds(null);

      default:
        // Legacy target_type-equivalents (e.g. 'hr' from target_role).
        return this.roleRecipientIds(String(targetType));
    }
  }

  /** ACTIVE users, optionally narrowed to holders of a role slug. */
  private async roleRecipientIds(roleSlug: string | null): Promise<string[]> {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .select('u.id', 'id')
      .where('u.status = :status', { status: UserStatus.ACTIVE });

    if (roleSlug) {
      qb.innerJoin('u.userRoles', 'ur')
        .innerJoin('ur.role', 'r')
        .andWhere('r.slug = :slug', { slug: roleSlug });
    }

    const rows: { id: string }[] = await qb.getRawMany();
    return [...new Set(rows.map((r) => r.id))];
  }

  /**
   * Students assigned to a study group — the SAME roster union used
   * everywhere else: active `group_students` rows ∪ ACTIVE enrollments
   * (LMS source of truth), restricted to active user accounts.
   */
  private async groupRosterIds(groupId: string): Promise<string[]> {
    const rows: { id: string }[] = await this.groupRepo.query(
      `SELECT DISTINCT s.user_id AS id
       FROM students s
       INNER JOIN users u ON u.id = s.user_id AND u.status = $3
       WHERE s.id IN (
         SELECT student_id FROM group_students WHERE group_id = $1 AND status = 'active'
         UNION
         SELECT student_id FROM enrollments WHERE group_id = $2 AND LOWER(CAST(status AS TEXT)) = 'active'
       )`,
      [groupId, groupId, UserStatus.ACTIVE],
    );
    return [...new Set(rows.map((r) => r.id))];
  }
}

