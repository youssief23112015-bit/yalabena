import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../shared/entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

export interface NotificationQuery {
  page?: number;
  limit?: number;
  unread_only?: boolean;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
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
}

