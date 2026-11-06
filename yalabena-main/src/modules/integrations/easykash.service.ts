import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Payment } from '../../shared/entities/payment.entity';
import { Invoice } from '../../shared/entities/invoice.entity';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';

const fetchFn: any = (globalThis as any).fetch;

/**
 * EasyKash online payment gateway (SRS 5.3) — the ONLY online gateway allowed.
 * Checkout redirect + webhook confirmation + refund support.
 * Full transaction log is retained in the payments table for reconciliation.
 */
@Injectable()
export class EasyKashService {
  private readonly logger = new Logger(EasyKashService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly config: ConfigService,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('EASYKASH_API_URL') && this.config.get<string>('EASYKASH_API_KEY'));
  }

  private gatewayMethod(): PaymentStatus {
    const values = Object.values(PaymentStatus) as string[];
    return (values.find((v) => /easy|online|card|gateway/i.test(v)) ?? values[0]) as PaymentStatus;
  }

  private status(value: string, fallback: string): PaymentStatus {
    const values = Object.values(PaymentStatus) as string[];
    return (values.find((v) => v.toLowerCase() === value.toLowerCase()) ?? fallback) as PaymentStatus;
  }

  /** Create a checkout session for an invoice and return the redirect URL. */
  async createCheckoutSession(input: {
    invoiceId: string;
    amount: number;
    customerEmail: string;
    successUrl?: string;
    failUrl?: string;
  }): Promise<{ payment_url: string; reference: string }> {
    const base = this.config.get<string>('EASYKASH_API_URL');
    const key = this.config.get<string>('EASYKASH_API_KEY');
    if (!base || !key) {
      throw new BadRequestException('EasyKash is not configured. Set EASYKASH_API_URL and EASYKASH_API_KEY (use the sandbox first).');
    }

    const invoice = await this.invoiceRepo.findOne({ where: { id: input.invoiceId } });
    if (!invoice) {
      throw new BadRequestException(`Invoice ${input.invoiceId} not found`);
    }

    const reference = `EK-${invoice.invoice_number}-${Date.now()}`;
    const res = await fetchFn(`${base}/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference,
        amount: input.amount,
        currency: this.config.get<string>('EASYKASH_CURRENCY', 'EGP'),
        customer_email: input.customerEmail,
        success_url: input.successUrl ?? this.config.get<string>('EASYKASH_SUCCESS_URL'),
        fail_url: input.failUrl ?? this.config.get<string>('EASYKASH_FAIL_URL'),
      }),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new BadRequestException(`EasyKash checkout error ${res.status}: ${text}`);
    }
    const data = JSON.parse(text);

    // Register the pending payment (full transaction log for reconciliation)
    await this.paymentRepo.save(
      this.paymentRepo.create({
        invoice_id: invoice.id,
        amount: input.amount,
        method: this.gatewayMethod() as any,
        status: this.status('pending', 'pending') as any,
        paid_at: new Date(),
        easykash_transaction_id: reference,
        notes: 'easykash-checkout',
      } as Partial<Payment>),
    );

    return { payment_url: data.payment_url ?? data.checkout_url, reference };
  }

  /** HMAC-SHA256 webhook verification. */
  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    const secret = this.config.get<string>('EASYKASH_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('EASYKASH_WEBHOOK_SECRET not set — accepting webhook without verification!');
      return true;
    }
    if (!signature) return false;
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }

 /** Payment confirmation webhook -> DB trigger automatically syncs invoice financials (SRS 5.3). */
  async handleWebhook(payload: any): Promise<{ updated: boolean }> {
    const reference: string = payload?.reference ?? payload?.transaction_id ?? payload?.merchant_reference;
    if (!reference) {
      throw new BadRequestException('Webhook payload has no reference.');
    }

    const payment = await this.paymentRepo.findOne({
      where: { easykash_transaction_id: reference },
      relations: ['invoice'],
    });
    if (!payment) {
      throw new BadRequestException(`No pending payment found for reference ${reference}`);
    }

    const successful = ['success', 'paid', 'completed', 'captured'].includes(String(payload?.status ?? '').toLowerCase());
    payment.status = this.status(successful ? 'completed' : 'failed', successful ? 'completed' : 'failed') as any;
    await this.paymentRepo.save(payment);

    // ملاحظة: تم إزالة التحديث اليدوي للفاتورة لأن الـ DB Trigger (sync_invoice_financials) 
    // سيقوم بتحديث الـ paid_amount والحالة والـ balance تلقائياً وبشكل ذري في قاعدة البيانات بمجرد حفظ الـ Payment.

    this.logger.log(`EasyKash webhook processed: ${reference} -> ${payment.status}`);
    return { updated: true };
  }

  /** Refund via API if supported, otherwise track a manual refund status. */
  async requestRefund(reference: string, amount?: number, reason?: string): Promise<{ refunded: boolean }> {
    const payment = await this.paymentRepo.findOne({ where: { easykash_transaction_id: reference } });
    if (!payment) {
      throw new BadRequestException(`Payment ${reference} not found`);
    }

    const base = this.config.get<string>('EASYKASH_API_URL');
    const key = this.config.get<string>('EASYKASH_API_KEY');
    if (base && key) {
      try {
        const res = await fetchFn(`${base}/refunds`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference, amount: amount ?? payment.amount, reason }),
        });
        if (res.ok) {
          payment.status = this.status('refunded', 'refunded') as any;
          await this.paymentRepo.save(payment);
          return { refunded: true };
        }
        this.logger.warn(`EasyKash refund API returned ${res.status} — recording manual refund.`);
      } catch (err) {
        this.logger.warn(`EasyKash refund API unavailable: ${(err as Error).message}`);
      }
    }

    // Manual refund flow with status tracking (SRS 5.3 fallback)
    payment.status = this.status('refunded', 'refunded') as any;
    payment.notes = `${payment.notes ?? ''} | manual refund: ${reason ?? 'n/a'}`.trim();
    await this.paymentRepo.save(payment);
    return { refunded: true, manual: true } as any;
  }
}
