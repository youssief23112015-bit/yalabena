import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from '../../shared/entities/support-ticket.entity';
import { SupportTicketReply } from '../../shared/entities/support-ticket-reply.entity';
import { User } from '../../shared/entities/user.entity';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket, SupportTicketReply, User]),
    NotificationsModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}