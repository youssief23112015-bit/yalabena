import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatRoom } from '../../shared/entities/chat-room.entity';
import { ChatRoomMember } from '../../shared/entities/chat-room-member.entity';
import { ChatMessage } from '../../shared/entities/chat-message.entity';
import { ChatViolation } from '../../shared/entities/chat-violation.entity';
import { ChatStrike } from '../../shared/entities/chat-strike.entity';
import { User } from '../../shared/entities/user.entity';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, ChatRoomMember, ChatMessage, ChatViolation, ChatStrike, User]),
    JwtModule.register({}),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, WsJwtGuard],
  exports: [ChatService],
})
export class ChatModule {}
