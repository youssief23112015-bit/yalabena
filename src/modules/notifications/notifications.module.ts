import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from '../../shared/entities/notification.entity';
import { NotificationPreference } from '../../shared/entities/notification-preference.entity';
import { User } from '../../shared/entities/user.entity';
import { Group } from '../../shared/entities/group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      User,
      // Group is required by the broadcast targeting rules: teacher-senders
      // must be the assigned teacher_id of the target group.
      Group,
    ]),
    // The realtime gateway verifies user JWTs on each socket connection.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationsGateway],
  exports: [NotificationService],
})
export class NotificationsModule {}