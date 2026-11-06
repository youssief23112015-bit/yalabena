import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PromoCode } from '../../shared/entities/promo-code.entity';
import { PromoType } from '../../common/enums/promo-type.enum';
import { round2 } from '../../common/utils/math.util';

/**
 * Owns promo-code validation, discount computation and usage accounting
 * (SRS §4.8). Injected into FinanceService so invoice generation and any
 * future checkout flows share ONE implementation of these rules.
 */
@Injectable()
export class PromoCodeService {
  constructor(
    @InjectRepository(PromoCode) private promoRepo: Repository<PromoCode>,
  ) {}

  /**
   * Validate a promo code: existence, active status, expiry, usage limit
   * and branch/course scoping. Throws 404/400 on any failure.
   */
  async validatePromoCode(
    code: string,
    courseId?: string,
    branchId?: string,
  ): Promise<PromoCode> {
    const promo = await this.promoRepo.findOne({
      where: { code, status: 'active' } as any,
    });
    if (!promo) throw new NotFoundException('Invalid promo code');
    if (new Date(promo.expiry_date) < new Date()) {
      throw new BadRequestException('Promo code expired');
    }
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      throw new BadRequestException('Promo code usage limit reached');
    }
    if (
      courseId &&
      promo.applicable_courses &&
      !promo.applicable_courses.includes(courseId)
    ) {
      throw new BadRequestException('Promo code not applicable to this course');
    }
    if (
      branchId &&
      promo.applicable_branches &&
      !promo.applicable_branches.includes(branchId)
    ) {
      throw new BadRequestException('Promo code not applicable to this branch');
    }
    return promo;
  }

  /**
   * Discount for a validated promo applied to a subtotal:
   * percentage (capped by max_discount) or fixed amount,
   * clamped to [0, subtotal].
   */
  computeDiscount(promo: PromoCode, subtotal: number): number {
    const raw =
      promo.type === PromoType.PERCENTAGE
        ? (subtotal * Number(promo.value)) / 100
        : Number(promo.value);
    const capped =
      promo.max_discount != null
        ? Math.min(raw, Number(promo.max_discount))
        : raw;
    return round2(Math.max(0, Math.min(capped, subtotal)));
  }

  /**
   * Atomic `used_count = used_count + 1` (no read-modify-write race).
   * Pass the invoice transaction's EntityManager so the increment commits
   * or rolls back together with the invoice the promo was applied to.
   */
  async incrementUsage(promoId: string, em?: EntityManager): Promise<void> {
    const manager = em ?? this.promoRepo.manager;
    await manager.increment(PromoCode, { id: promoId }, 'used_count', 1);
  }
}