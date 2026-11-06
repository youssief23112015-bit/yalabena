import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

/**
 * Realtime push for the in-app notification center (SRS 4.18).
 * Each authenticated socket joins a private room `user:<id>`; the
 * NotificationService emits `notification` events into it.
 */
@WebSocketGateway({ namespace: 'notifications', cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake?.auth?.token ||
      client.handshake?.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify(token);
      client.data.user = { ...payload, userId: payload.sub };
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  /** Push a notification payload to a single connected user (no-op if offline). */
  sendToUser(userId: string, payload: any) {
    this.server?.to(`user:${userId}`).emit('notification', payload);
  }
}
