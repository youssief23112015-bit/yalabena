import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient();
    const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      this.logger.warn(`No token provided for socket ${client.id}`);
      return false;  // Don't disconnect — let client retry with auth
    }

    try {
      const payload = this.jwtService.verify(token);
      client.data.user = { ...payload, userId: payload.sub };
      return true;
    } catch (err: any) {
      this.logger.warn(`Invalid token for socket ${client.id}: ${err?.message}`);
      return false;  // Don't disconnect — let client refresh and retry
    }
  }
}