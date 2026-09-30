import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ChatConsentService } from '../chat-consent.service';

/**
 * WsChatConsentGuard — per-event Consent enforcement on the chat gateway
 * (SRS §6.6). Runs AFTER WsJwtGuard (declared second in @UseGuards), so
 * client.data.user is already populated. Users who haven't accepted the
 * current chat policy are rejected from every chat event; combined with
 * the connection-level disconnect in ChatGateway.handleConnection, this
 * blocks both "connecting" and "sending messages".
 */
@Injectable()
export class WsChatConsentGuard implements CanActivate {
  constructor(private readonly consentService: ChatConsentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const userId = client.data?.user?.userId;
    if (!userId) return false;

    try {
      const status = await this.consentService.getStatus(userId);
      return status.accepted;
    } catch {
      return false; // fail closed
    }
  }
}