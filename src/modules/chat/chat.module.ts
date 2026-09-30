import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatConsentService } from './chat-consent.service';
import { ChatRoom } from '../../shared/entities/chat-room.entity';
import { ChatRoomMember } from '../../shared/entities/chat-room-member.entity';
import { ChatMessage } from '../../shared/entities/chat-message.entity';
import { ChatViolation } from '../../shared/entities/chat-violation.entity';
import { ChatStrike } from '../../shared/entities/chat-strike.entity';
import { ChatConsent } from '../../shared/entities/chat-consent.entity';
import { User } from '../../shared/entities/user.entity';
import { Group } from '../../shared/entities/group.entity';
import { GroupStudent } from '../../shared/entities/group-student.entity';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { UserRole } from '../../shared/entities/user-role.entity';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsChatConsentGuard } from './guards/ws-consent.guard';
import { ChatConsentGuard } from './guards/chat-consent.guard';
import { PdfService } from '../pdf/pdf.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom, ChatRoomMember, ChatMessage, ChatViolation, ChatStrike, ChatConsent, User,
      // FIX (Room Access): repositories needed by the enrollment check
      Group, GroupStudent, Enrollment, UserRole,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRATION', '15m') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    ChatConsentService,
    WsJwtGuard,
    WsChatConsentGuard, // NEW: WS consent enforcement
    ChatConsentGuard,   // NEW: REST consent enforcement
    PdfService,
  ],
  exports: [ChatService, ChatConsentService, PdfService],
})
export class ChatModule {}