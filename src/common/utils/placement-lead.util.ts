import { Lead } from '../../shared/entities/lead.entity';
import { LeadSource } from '../enums/lead-source.enum';
import { LeadStatus } from '../enums/lead-status.enum';

/**
 * Minimal structural contract for a Lead repository — satisfied both by
 * TypeORM's Repository<Lead> and by the EntityManager-scoped repo used in
 * PublicService (and its spec mocks).
 */
export interface LeadLikeRepo {
  createQueryBuilder(alias: string): any;
  create(data: Partial<Lead>): Lead;
  save(lead: Lead): Promise<Lead>;
}

export interface PlacementContact {
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
  branch_id?: string | null;
  level_interest?: string | null;
  source: LeadSource;
}

/**
 * Find-or-create the Lead behind a placement-test booking, deduplicating by
 * phone OR email (Business Rule 2). Existing leads are enriched (missing
 * email/branch/level) and advanced to TEST_SCHEDULED so sales/academic see
 * the booking — never regressing terminal statuses (ENROLLED / LOST).
 */
export async function upsertLeadForPlacement(
  leadRepo: LeadLikeRepo,
  contact: PlacementContact,
): Promise<Lead> {
  const phone = contact.phone?.trim() || null;
  const email = contact.email?.trim() || null;
  if (!phone && !email) {
    throw new Error('A phone or email is required to track the placement lead');
  }

  let qb = leadRepo.createQueryBuilder('lead');
  if (phone) {
    qb = qb.where('lead.phone = :phone', { phone });
    if (email) qb = qb.orWhere('lead.email = :email', { email });
  } else {
    qb = qb.where('lead.email = :email', { email });
  }
  let lead = await qb.getOne();

  if (lead) {
    let changed = false;
    if (!lead.email && email) { lead.email = email; changed = true; }
    if (!lead.branch_id && contact.branch_id) { lead.branch_id = contact.branch_id; changed = true; }
    if (!lead.level_interest && contact.level_interest) {
      lead.level_interest = contact.level_interest;
      changed = true;
    }
    if (
      lead.status !== LeadStatus.ENROLLED &&
      lead.status !== LeadStatus.LOST &&
      lead.status !== LeadStatus.TEST_SCHEDULED
    ) {
      lead.status = LeadStatus.TEST_SCHEDULED;
      changed = true;
    }
    if (changed) lead = await leadRepo.save(lead);
    return lead;
  }

  return leadRepo.save(
    leadRepo.create({
      first_name: contact.first_name,
      last_name: contact.last_name,
      ...(phone ? { phone } : { phone: email as string }),
      ...(email ? { email } : {}),
      ...(contact.branch_id ? { branch_id: contact.branch_id } : {}),
      ...(contact.level_interest ? { level_interest: contact.level_interest } : {}),
      source: contact.source,
      status: LeadStatus.TEST_SCHEDULED,
    }),
  );
}

export interface PlacementResultPatch {
  /** Exam score/degree (percent) — written+oral combined when final. */
  score?: number | null;
  /** Evaluated CEFR level (A1–C2). */
  level?: string | null;
  /**
   * 'written': automated written-test result — lead becomes INTERESTED
   *   (score available, awaiting oral / sales follow-up).
   * 'final': examiner-graded result — lead becomes TEST_COMPLETED.
   */
  phase: 'written' | 'final';
}

/**
 * Write a placement-test result onto the Lead record (Business Rule 2):
 * the achieved degree, the evaluated CEFR level (also mirrored into
 * level_interest so lead→student conversion carries it), and the pipeline
 * status. Mutates and returns the lead; the caller persists it.
 */
export function applyPlacementResultToLead<T extends Lead>(
  lead: T,
  result: PlacementResultPatch,
): T {
  if (result.score !== null && result.score !== undefined && Number.isFinite(Number(result.score))) {
    lead.placement_score = Number(result.score);
  }
  if (result.level) {
    lead.placement_level = result.level;
    lead.level_interest = result.level;
  }
  if (result.phase === 'final') {
    if (lead.status !== LeadStatus.ENROLLED) {
      lead.status = LeadStatus.TEST_COMPLETED;
    }
  } else if (
    lead.status === LeadStatus.NEW ||
    lead.status === LeadStatus.CONTACTED ||
    lead.status === LeadStatus.TEST_SCHEDULED ||
    !lead.status
  ) {
    lead.status = LeadStatus.INTERESTED;
  }
  return lead;
}
