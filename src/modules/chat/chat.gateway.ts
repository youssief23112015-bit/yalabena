import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() dto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) return { error: 'Unauthorized' };

    await this.chatService.joinRoom(dto.room_id, userId);
    client.join(dto.room_id);
    client.to(dto.room_id).emit('user_joined', { user_id: userId, room_id: dto.room_id });
    return { success: true, room_id: dto.room_id };
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() dto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) return { error: 'Unauthorized' };

    await this.chatService.leaveRoom(dto.room_id, userId);
    client.leave(dto.room_id);
    client.to(dto.room_id).emit('user_left', { user_id: userId, room_id: dto.room_id });
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() dto: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) return { error: 'Unauthorized' };

    // Compliance scan
    const scan = this.chatService.scanMessage(dto.body || '');
    if (scan?.violation) {
      // Log violation but don't save the message
            await this.chatService.logViolation(
        null, // message was blocked before persistence — no message_id exists
        dto.room_id,
        userId,
        scan.rule,
        dto.body || '',
        scan.action,
      );
      return { error: 'Message blocked: contact sharing detected', rule: scan.rule };
    }

    const message = await this.chatService.saveMessage(dto, userId);
    const fullMessage = await this.chatService['messageRepo'].findOne({
      where: { id: message.id },
      relations: ['sender'],
    });

    this.server.to(dto.room_id).emit('new_message', fullMessage);
    return { success: true, message: fullMessage };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { room_id: string; is_typing: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) return;
    client.to(data.room_id).emit('typing', { user_id: userId, is_typing: data.is_typing });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { room_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) return { error: 'Unauthorized' };

    const member = await this.chatService['memberRepo'].findOne({
      where: { room_id: data.room_id, user_id: userId },
    });
    if (member) {
      member.last_read_at = new Date();
      await this.chatService['memberRepo'].save(member);
    }
    return { success: true };
  }
}
