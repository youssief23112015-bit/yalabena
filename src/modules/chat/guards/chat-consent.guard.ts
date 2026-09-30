import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ChatConsentService } from '../chat-consent.service';
import { CHAT_CONSENT_EXEMPT_KEY } from '../decorators/skip-chat-consent.decorator';

/**
 * ChatConsentGuard — enforces "consent before chat" on every REST endpoint
 * of the Chat controller (SRS §6.6). Global guards (JwtAuthGuard,
 * RolesGuard) run first, so request.user is guaranteed to be populated.
 *
 * Endpoints that must stay reachable WITHOUT prior consent — namely
 * checking status and accepting the policy — are marked with
 * @SkipChatConsent().
 */
@Injectable()
export class ChatConsentGuard implements CanActivate {
  constructor(
    private readonly consentService: ChatConsentService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isExempt = this.reflector.getAllAndOverride<boolean>(
      CHAT_CONSENT_EXEMPT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isExempt) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user?.userId) return true; // JwtAuthGuard rejects unauthenticated anyway

    const status = await this.consentService.getStatus(user.userId);
    if (!status.accepted) {
      throw new ForbiddenException(
        'You must accept the chat policy before using chat. ' +
        'This attempt has been logged.',
      );
    }
    return true;
  }
}