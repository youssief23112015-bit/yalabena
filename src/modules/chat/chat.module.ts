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
import { WsJwtGuard } from './guards/ws-jwt.guard';
// ASSUMPTION: PdfService lives at src/modules/pdf/pdf.service.ts (the
// project's module listing already has a `pdf` folder). If your PdfService
// is instead wrapped in its own PdfModule, prefer importing that module and
// exporting PdfService from there rather than instantiating a second copy
// here — that matters if it holds any of its own repositories or config.
import { PdfService } from '../pdf/pdf.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom, ChatRoomMember, ChatMessage, ChatViolation, ChatStrike, ChatConsent, User,
    ]),
    // FIX: was JwtModule.register({}) — an empty config, no secret. Every
    // WsJwtGuard.verify() call was therefore throwing (nothing to check
    // the signature against), which the guard caught and turned into an
    // immediate client.disconnect(). This is the connect→disconnect loop
    // you were seeing. Now mirrors AuthModule's config exactly, so the
    // chat gateway verifies against the same secret the REST side signs
    // with.
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
  providers: [ChatGateway, ChatService, ChatConsentService, WsJwtGuard, PdfService],
  exports: [ChatService, ChatConsentService, PdfService],
})
export class ChatModule {}