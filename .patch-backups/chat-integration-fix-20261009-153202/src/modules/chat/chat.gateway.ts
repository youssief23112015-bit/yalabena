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
import { HttpException, Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { ChatConsentService } from './chat-consent.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { WsChatConsentGuard } from './guards/ws-consent.guard';

interface WsErrorFrame {
  success: false;
  error: string;
  code: number;
}

@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
@UseGuards(WsJwtGuard, WsChatConsentGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly consentService: ChatConsentService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Connection-level Consent enforcement (SRS §6.6): an authenticated
    // user who has not accepted the current chat policy is told why and
    // disconnected; they reconnect after accepting via POST /chat/consent.
    void this.authenticateAndEnforceConsent(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Guards only wrap @SubscribeMessage handlers, so the connection itself
   * must authenticate + check consent manually. Mirrors WsJwtGuard's
   * retry-friendly policy for bad/missing tokens (no disconnect), but a
   * VALID token without consent ⇒ disconnect.
   */
  private async authenticateAndEnforceConsent(client: Socket): Promise<void> {
    const token =
      client.handshake?.auth?.token ||
      client.handshake?.headers?.authorization?.replace('Bearer ', '');

    if (!token) return; // per-event guards will reject until a token arrives

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      return; // expired/invalid — client refreshes and reconnects
    }

    const userId: string = payload.sub;
    client.data.user = { ...payload, userId };

    try {
      const status = await this.consentService.getStatus(userId);
      if (!status.accepted) {
        client.emit('consent_required', { policy_version: status.policy_version });
        client.disconnect(true);
      }
    } catch (err: any) {
      this.logger.error(`Consent check failed for ${userId}: ${err?.message}`);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() dto: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) return { error: 'Unauthorized' };

    try {
      // Throws NotFound/Forbidden if the user is not enrolled in the
      // room's group (and is not staff / the group's teacher).
      await this.chatService.joinRoom(dto.room_id, userId);
    } catch (err) {
      return this.wsError(client, err);
    }

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

    try {
      await this.chatService.leaveRoom(dto.room_id, userId);
    } catch (err) {
      return this.wsError(client, err);
    }

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

    // FIX (Double-Scan): the gateway NO LONGER scans the message itself.
    // ChatService.saveMessage is the single enforcement point — membership,
    // ban/mute, attachment validation, contact-info scan, violation
    // logging and strike escalation all happen there, exactly once, for
    // both the WS and REST paths. Any ForbiddenException it throws (with
    // the SRS §6.4 wording) is converted into a WS error frame below, so
    // the client experience is now identical across both transports.
    try {
      const message = await this.chatService.saveMessage(dto, userId);
      const fullMessage = await this.chatService.getMessageWithSender(message.id);
      this.server.to(dto.room_id).emit('new_message', fullMessage);
      return { success: true, message: fullMessage };
    } catch (err) {
      return this.wsError(client, err);
    }
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

    try {
      await this.chatService.markAsRead(data.room_id, userId);
    } catch (err) {
      return this.wsError(client, err);
    }
    return { success: true };
  }

  /**
   * Unified WS error handling: any HttpException thrown by the service
   * layer (Forbidden / NotFound / BadRequest) becomes a structured frame
   * `{ success:false, error, code }` — returned as the ack payload AND
   * emitted as a 'chat_error' event to the sending socket only.
   * Matches the REST exception messages byte-for-byte.
   */
  private wsError(client: Socket, err: unknown): WsErrorFrame {
    const frame: WsErrorFrame =
      err instanceof HttpException
        ? { success: false, error: err.message, code: err.getStatus() }
        : { success: false, error: 'Internal server error', code: 500 };

    if (!(err instanceof HttpException)) {
      this.logger.error(`Unexpected WS error: ${(err as any)?.stack ?? err}`);
    }

    client.emit('chat_error', frame);
    return frame;
  }
}