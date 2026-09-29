import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConsent } from '../../shared/entities/chat-consent.entity';

export const CHAT_POLICY_VERSION = '1.0';

@Injectable()
export class ChatConsentService {
  constructor(
    @InjectRepository(ChatConsent) private consentRepo: Repository<ChatConsent>,
  ) {}

  /**
   * Idempotent: re-accepting (e.g. after the policy_version changes) just
   * updates the existing row rather than erroring on the unique user_id index.
   */
  async accept(userId: string, policyVersion = CHAT_POLICY_VERSION): Promise<ChatConsent> {
    let consent = await this.consentRepo.findOne({ where: { user_id: userId } });
    if (!consent) {
      consent = this.consentRepo.create({ user_id: userId, accepted_at: new Date(), policy_version: policyVersion });
    } else {
      consent.accepted_at = new Date();
      consent.policy_version = policyVersion;
    }
    return this.consentRepo.save(consent);
  }

  async getStatus(userId: string): Promise<{ accepted: boolean; accepted_at: string | null; policy_version: string | null }> {
    const consent = await this.consentRepo.findOne({ where: { user_id: userId } });
    if (!consent) return { accepted: false, accepted_at: null, policy_version: null };

    // If you bump CHAT_POLICY_VERSION for a policy change, treat older
    // acceptances as stale so the modal reappears.
    const accepted = consent.policy_version === CHAT_POLICY_VERSION;
    return {
      accepted,
      accepted_at: consent.accepted_at.toISOString(),
      policy_version: consent.policy_version,
    };
  }
}
