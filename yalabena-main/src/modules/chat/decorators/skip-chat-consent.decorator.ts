import { SetMetadata } from '@nestjs/common';

export const CHAT_CONSENT_EXEMPT_KEY = 'chatConsentExempt';

/**
 * Marks an endpoint as reachable WITHOUT prior chat-policy consent.
 * Use ONLY for: GET /chat/consent (status) and POST /chat/consent (accept).
 */
export const SkipChatConsent = () => SetMetadata(CHAT_CONSENT_EXEMPT_KEY, true);