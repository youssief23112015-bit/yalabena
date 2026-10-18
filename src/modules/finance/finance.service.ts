import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from '../../shared/entities/invoice.entity';
import { Payment } from '../../shared/entities/payment.entity';
import { Installment } from '../../shared/entities/installment.entity';
import { Refund } from '../../shared/entities/refund.entity';
import { PromoCode } from '../../shared/entities/promo-code.entity';
import { FinancialTransaction } from '../../shared/entities/financial-transaction.entity';
import { InvoiceItem } from '../../shared/entities/invoice-item.entity';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { RefundStatus } from '../../common/enums/refund-status.enum';
import { TransactionDirection } from '../../common/enums/transaction-direction.enum';
import { FinancialTransactionType } from '../../common/enums/financial-transaction-type.enum';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { PromoCodeService } from './promo-code.service';
import { InstallmentStatus } from '../../common/enums/installment-status.enum';
import { InvoiceItemType } from '../../common/enums/invoice-item-type.enum';
import { round2 } from '../../common/utils/math.util';
import { effectiveBranchFilter } from '../../common/utils/branch-scope';


@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Installment) private installmentRepo: Repository<Installment>,
    @InjectRepository(Refund) private refundRepo: Repository<Refund>,
    @InjectRepository(PromoCode) private promoRepo: Repository<PromoCode>,
    @InjectRepository(FinancialTransaction) private ftRepo: Repository<FinancialTransaction>,
    @InjectRepository(InvoiceItem) private itemRepo: Repository<InvoiceItem>,
    private dataSource: DataSource,
    private promoCodeService: PromoCodeService,
  ) {}

  // ─── ALIASES FOR CONTROLLER & ENROLLMENTS COMPATIBILITY ───

  /**
   * Invoice generation for a new enrollment (SRS §4.8). Delegates to
   * createInvoice, which now honours the enrollment payload fields:
   * `amount` (subtotal), `manual_discount` (mapped to discount_amount),
   * `promo_code` (validated + counted), `installments_count` (plan split)
   * and `due_days` (invoice due date, default 7 days).
   */
  async createInvoiceForEnrollment(data: any) {
    return this.createInvoice(data, data.created_by, data.branch_id);
  }

  /**
   * Idempotency guard for the enrollment approval flow: approval must never
   * double-bill a student whose enrollment was already invoiced (e.g. via
   * the staff-created enrollment path or a retried approval).
   */
  async hasInvoiceForEnrollment(enrollmentId: string): Promise<boolean> {
    if (!enrollmentId) return false;
    const count = await this.invoiceRepo.count({
      where: { enrollment_id: enrollmentId },
    });
    return count > 0;
  }

  async createManualInvoice(dto: CreateInvoiceDto, user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    const branchId = typeof user === 'object' ? user?.branch_id || user?.branchId : undefined;
    return this.createInvoice(dto, userId, branchId);
  }

  async listInvoices(query: QueryInvoiceDto, user: any) {
    return this.findInvoices(query, user);
  }

  async createPromo(dto: CreatePromoCodeDto, user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.createPromoCode(dto, userId);
  }

  async listPromos() {
    return this.promoRepo.find();
  }

  async setPromoStatus(id: string, status: 'active' | 'inactive') {
    await this.promoRepo.update(id, { status } as any);
    return { success: true };
  }

  async listPayments(
    user: any,
    filter: { invoice_id?: string; branch_id?: string; from?: string; to?: string } = {},
  ) {
    // Payment has NO branch_id / from / to columns — passing those keys to
    // find({ where }) throws EntityPropertyNotFoundError. Branch scoping
    // goes through the invoice relation; the date range maps to paid_at.
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .innerJoinAndSelect('p.invoice', 'invoice')
      .leftJoinAndSelect('invoice.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('invoice.branch', 'branch')
      .leftJoinAndSelect('p.recorder', 'recorder')
      .orderBy('p.paid_at', 'DESC');

    const branchFilter = effectiveBranchFilter(user, filter?.branch_id);
    // '__none__' = branchless non-admin: return nothing rather than running
    // an invalid uuid comparison against the invoice.branch_id column.
    if (branchFilter === '__none__') return [];
    if (branchFilter) {
      qb.andWhere('invoice.branch_id = :branchId', { branchId: branchFilter });
    }
    if (filter?.invoice_id) {
      qb.andWhere('p.invoice_id = :invoiceId', { invoiceId: filter.invoice_id });
    }
    if (filter?.from) qb.andWhere('p.paid_at >= :from', { from: filter.from });
    if (filter?.to) qb.andWhere('p.paid_at <= :to', { to: filter.to });

    return qb.getMany();
  }

  async getPayment(id: string, user: any) {
    return this.getPaymentWithDetails(id);
  }

  async createRefund(dto: CreateRefundDto, user: any) {
    const userId = typeof user === 'string' ? user : user?.id;
    return this.requestRefund(dto, userId);
  }

  /**
   * Refund list (SRS §4.8). Refund has NO branch_id column — the previous
   * find({ where: { branch_id } }) crashed with EntityPropertyNotFoundError.
   * Branch scoping runs through invoice.branch_id; the response carries the
   * invoice/branch/payment and approver/processor details for the UI.
   */
  async listRefunds(
    user: any,
    filter: { status?: string; branch_id?: string } = {},
  ) {
    const qb = this.refundRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.invoice', 'invoice')
      .leftJoinAndSelect('invoice.branch', 'branch')
      .leftJoinAndSelect('r.payment', 'payment')
      .leftJoinAndSelect('r.approver', 'approver')
      .leftJoinAndSelect('r.processor', 'processor')
      .orderBy('r.created_at', 'DESC');

    const branchFilter = effectiveBranchFilter(user, filter?.branch_id);
    // '__none__' = branchless non-admin: return nothing rather than running
    // an invalid uuid comparison against the invoice.branch_id column.
    if (branchFilter === '__none__') return [];
    if (branchFilter) {
      qb.andWhere('invoice.branch_id = :branchId', { branchId: branchFilter });
    }
    if (filter?.status) {
      qb.andWhere('r.status = :status', { status: filter.status });
    }

    return qb.getMany();
  }

  async decideRefund(id: string, action: string, note: string, user: any) {
    // ApproveRefundDto only accepts lowercase 'approve' | 'reject' — the
    // previous `action === 'APPROVE'` comparison was never true, so every
    // approval was silently stored as REJECTED. Normalise the case.
    const approved = String(action).toUpperCase() === 'APPROVE';
    const status = approved ? RefundStatus.APPROVED : RefundStatus.REJECTED;
    // Refund has no `rejection_reason` column — writing it crashed the UPDATE
    // with EntityPropertyNotFoundError. Persist the decision note in the
    // real `reason_note` column, and only on rejection so the original
    // request note survives approvals.
    const patch: any = { status };
    if (status === RefundStatus.REJECTED && note) patch.reason_note = note;
    await this.refundRepo.update(id, patch);
    return { success: true };
  }

  async ledger(user: any, from?: string, to?: string, branchId?: string) {
    return this.getRevenueReport(branchId || user?.branchId || null, from ? new Date(from) : new Date(0), to ? new Date(to) : new Date());
  }

  async receivables(user: any, branchId?: string) {
    return this.getOutstandingPayments(branchId || user?.branchId || null);
  }

  // ─── RECEIPTS (SRS 4.8) ───

  async getPaymentWithDetails(id: string) {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: [
        'invoice',
        'invoice.student',
        'invoice.student.user',
        'invoice.branch',
        'invoice.items',
      ],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  // ─── INVOICES ───

  async createInvoice(dto: CreateInvoiceDto, userId: string, branchId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { items: dtoItems, ...invoiceData } = dto;

      // The PG schema enforces NOT NULL on subtotal / total_amount /
      // due_date, but NEITHER caller supplies them: the enrollment path
      // passes a flat `amount`, the manual path passes priced `items[]`.
      // Normalise all three here so both flows produce a valid invoice
      // (previously both crashed with "null value in column subtotal").
      const computedSubtotal =
        Number((invoiceData as any).subtotal) ||
        (dtoItems?.length
          ? dtoItems.reduce(
              (sum, it) => sum + Number(it.quantity) * Number(it.unit_price),
              0,
            )
          : Number((invoiceData as any).amount ?? 0));

      // ── Discounts & promo code (SRS §4.8) ──
      // Field-mismatch fix: enrollments send `manual_discount`, the manual
      // invoice DTO sends `discount_amount` — both feed the same column.
      // When a promo_code is provided it is validated (expiry, usage limit,
      // branch/course scoping) and its discount replaces the manual one.
      let discountAmount = round2(
        Number(
          (invoiceData as any).manual_discount ??
            (invoiceData as any).discount_amount ??
            0,
        ) || 0,
      );
      let promo: PromoCode | null = null;
      const promoCodeInput = (invoiceData as any).promo_code;
      if (promoCodeInput) {
        const courseId =
          (invoiceData as any).course_id ??
          dtoItems?.find((it: any) => it.course_id)?.course_id;
        promo = await this.validatePromoCode(
          String(promoCodeInput),
          courseId,
          branchId ?? (invoiceData as any).branch_id,
        );
        discountAmount = this.promoCodeService.computeDiscount(
          promo,
          computedSubtotal,
        );
      }

      const totalAmount = Number(
        (invoiceData as any).total_amount ??
          round2(computedSubtotal - discountAmount),
      );
      const rawDueDays = (invoiceData as any).due_days;
      const dueDays =
        rawDueDays === undefined || rawDueDays === null || rawDueDays === ''
          ? 7
          : Number(rawDueDays) || 0;
      const dueDate =
        (invoiceData as any).due_date ??
        new Date(Date.now() + dueDays * 86_400_000);

      const invoice = this.invoiceRepo.create({
        ...invoiceData,
        invoice_number: await this.generateInvoiceNumber(),
        // Super admins have no branch of their own — fall back to the
        // payload's branch (always present on the manual DTO).
        branch_id: branchId ?? (invoiceData as any).branch_id ?? null,
        created_by: userId,
        status: InvoiceStatus.UNPAID,
        paid_amount: 0,
        subtotal: computedSubtotal,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        balance_due: totalAmount,
        due_date: dueDate,
      } as any);
      const saved = (await queryRunner.manager.save(invoice)) as unknown as Invoice;
      if (dtoItems?.length) {
        const items = dtoItems.map((item: any) =>
          this.itemRepo.create({
            ...item,
            invoice_id: saved.id,
            // invoice_items.item_type is NOT NULL — derive it when the DTO
            // omits it (course-priced lines are COURSE, everything else OTHER).
            item_type:
              item.item_type ??
              (item.course_id
                ? InvoiceItemType.COURSE
                : InvoiceItemType.OTHER),
            // NOT NULL without DB defaults — compute explicitly.
            discount_amount: Number(item.discount_amount ?? 0),
            tax_amount: Number(item.tax_amount ?? 0),
            total_amount: round2(
              Number(item.quantity ?? 1) * Number(item.unit_price ?? 0),
            ),
          } as any),
        );
        await queryRunner.manager.save(items);
      }

      // ── Installment plan (SRS §4.8): split when installments_count > 1 ──
      // Rows are built with the injected installmentRepo but persisted
      // through the TRANSACTION manager: the invoice row is not visible to
      // other connections until commit, so a plain repo.save() would hit an
      // FK violation and could not roll back together with the invoice.
      const installmentsCount = Number((invoiceData as any).installments_count ?? 1);
      if (installmentsCount > 1) {
        const rows = this.buildInstallments(
          saved.id,
          totalAmount,
          installmentsCount,
          dueDate,
        );
        await queryRunner.manager.save(rows);
      }

      // ── Promo usage: atomic increment, committed with the invoice ──
      if (promo) {
        await this.promoCodeService.incrementUsage(promo.id, queryRunner.manager);
      }

      await queryRunner.commitTransaction();
      return this.invoiceRepo.findOne({ where: { id: saved.id }, relations: ['items'] });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Split an invoice total into `count` monthly installments starting at the
   * invoice due date. Equal base amounts; the LAST installment absorbs the
   * rounding remainder so the row amounts always sum exactly to the total.
   */
  private buildInstallments(
    invoiceId: string,
    total: number,
    count: number,
    firstDue: Date,
  ): Installment[] {
    const n = Math.floor(count);
    if (n <= 1) return [];
    const base = round2(total / n);
    const rows: Installment[] = [];
    for (let i = 1; i <= n; i++) {
      const amount = i === n ? round2(total - base * (n - 1)) : base;
      rows.push(
        this.installmentRepo.create({
          invoice_id: invoiceId,
          installment_number: i,
          amount,
          due_date: this.addMonths(firstDue, i - 1),
          paid_amount: 0,
          status: InstallmentStatus.PENDING,
        }),
      );
    }
    return rows;
  }

  /** Calendar-month offset used for sequential installment due dates. */
  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  async findInvoices(query: QueryInvoiceDto, user: any) {
    const qb = this.invoiceRepo.createQueryBuilder('i')
      .leftJoinAndSelect('i.items', 'items')
      .leftJoinAndSelect('i.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .orderBy('i.created_at', 'DESC');

    if (!user?.roles?.includes('super_admin') && user?.branchId) {
      qb.andWhere('i.branch_id = :branchId', { branchId: user.branchId });
    }
    if (query.status) qb.andWhere('i.status = :status', { status: query.status });
    if (query.student_id) qb.andWhere('i.student_id = :studentId', { studentId: query.student_id });
    if (query.due_from) qb.andWhere('i.due_date >= :from', { from: query.due_from });
    if (query.due_to) qb.andWhere('i.due_date <= :to', { to: query.due_to });

    const [data, total] = await qb.skip(query.offset || 0).take(query.limit || 20).getManyAndCount();
    return { data, total };
  }

  async getInvoice(id: string, user: any) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['items', 'payments', 'installments', 'student', 'student.user'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (!user?.roles?.includes('super_admin') && invoice.branch_id !== user?.branchId) {
      throw new ForbiddenException('Access denied');
    }
    return invoice;
  }

  // ─── PAYMENTS ───

  async recordPayment(dto: CreatePaymentDto, userOrUserId: any) {
    const userId = typeof userOrUserId === 'string' ? userOrUserId : userOrUserId?.id;
    const invoice = await this.invoiceRepo.findOne({ where: { id: dto.invoice_id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const payment = this.paymentRepo.create({
      ...dto,
      // payment_method PG enum holds LOWERCASE values while the DTO/frontend
      // send 'CASH' | 'BANK_TRANSFER' | 'EASYKASH' — normalise before insert.
      method: String(dto.method).toLowerCase() as any,
      // paid_at is NOT NULL without a DB default and the DTO never carries it.
      paid_at: new Date(),
      recorded_by: userId,
      status: PaymentStatus.COMPLETED,
      receipt_number: await this.generateReceiptNumber(),
    } as any);
    const saved = await this.paymentRepo.save(payment) as any;

    await this.syncInvoice(invoice.id);

    await this.ftRepo.save({
      branch_id: invoice.branch_id,
      invoice_id: invoice.id,
      payment_id: saved.id,
      transaction_type: FinancialTransactionType.PAYMENT,
      direction: TransactionDirection.IN,
      amount: dto.amount,
      transaction_date: (dto as any).paid_at || new Date(),
      description: `Payment ${saved.receipt_number}`,
      created_by: userId,
    } as any);

    return saved;
  }

  // ─── ACTIVITY FEES (SRS 4.11) ───

  /**
   * Record income collected for an extracurricular activity fee.
   * Activity fees are not tied to an enrollment, so they are booked directly
   * into the financial_transactions ledger (they show up in /finance/ledger
   * and the revenue report) instead of an invoice (invoices.enrollment_id
   * is NOT NULL in the schema).
   */
  async recordActivityFee(data: {
    branch_id: string;
    amount: number;
    description: string;
    created_by?: string;
    transaction_date?: Date;
  }) {
    return this.ftRepo.save({
      branch_id: data.branch_id,
      transaction_type: FinancialTransactionType.PAYMENT,
      direction: TransactionDirection.IN,
      amount: data.amount,
      transaction_date: data.transaction_date ?? new Date(),
      description: data.description,
      created_by: data.created_by ?? null,
    } as any);
  }

  // ─── REFUNDS ───

  async requestRefund(dto: CreateRefundDto, userId: string): Promise<Refund> {
    const payment = await this.paymentRepo.findOne({ where: { id: dto.payment_id } });
    if (!payment) throw new NotFoundException('Payment not found');

    const existingRefunds = await this.refundRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.amount), 0)', 'total')
      .where('r.payment_id = :pid', { pid: dto.payment_id })
      .andWhere('r.status IN (:...statuses)', { statuses: ['pending', 'approved', 'processed'] })
      .getRawOne();

    const totalRefunded = parseFloat(existingRefunds?.total || 0);
    if (totalRefunded + dto.amount > payment.amount) {
      throw new BadRequestException('Refund amount exceeds original payment');
    }

    const refund = this.refundRepo.create({
      ...dto,
      invoice_id: payment.invoice_id,
      status: RefundStatus.PENDING,
    } as unknown as Partial<Refund>);
    return this.refundRepo.save(refund);
  }

  async processRefund(id: string, userOrUserId: any) {
    const userId = typeof userOrUserId === 'string' ? userOrUserId : userOrUserId?.id;
    const refund = await this.refundRepo.findOne({ where: { id } });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== RefundStatus.APPROVED) {
      throw new BadRequestException('Refund must be approved first');
    }

    refund.status = RefundStatus.PROCESSED;
    refund.processed_by = userId;
    refund.processed_at = new Date();
    await this.refundRepo.save(refund);

    await this.syncInvoice(refund.invoice_id);

    const invoice = await this.invoiceRepo.findOne({ where: { id: refund.invoice_id } });
    await this.ftRepo.save({
      branch_id: invoice?.branch_id,
      invoice_id: refund.invoice_id,
      refund_id: refund.id,
      transaction_type: FinancialTransactionType.REFUND,
      direction: TransactionDirection.OUT,
      amount: refund.amount,
      transaction_date: new Date(),
      description: `Refund ${refund.reason_code}`,
      created_by: userId,
    } as any);

    return refund;
  }

  // ─── PROMO CODES ───

  async createPromoCode(dto: CreatePromoCodeDto, userId: string) {
    const promo = this.promoRepo.create({ ...dto, created_by: userId } as any);
    return this.promoRepo.save(promo);
  }

  async validatePromoCode(code: string, courseId?: string, branchId?: string) {
    // Delegates to PromoCodeService — the single source of truth for
    // expiry / usage-limit / branch / course scoping rules (kept as a
    // facade for the existing controller endpoint and tests).
    return this.promoCodeService.validatePromoCode(code, courseId, branchId);
  }

  // ─── REPORTS ───

  async getRevenueReport(branchId: string | null, from: Date, to: Date) {
    const qb = this.ftRepo.createQueryBuilder('ft')
      .select('SUM(ft.amount)', 'total')
      .addSelect('ft.transaction_type', 'type')
      .addSelect("TO_CHAR(ft.transaction_date, 'YYYY-MM')", 'month')
      .where('ft.direction = :dir', { dir: TransactionDirection.IN })
      .andWhere('ft.transaction_date BETWEEN :from AND :to', { from, to })
      .groupBy('ft.transaction_type')
      .addGroupBy("TO_CHAR(ft.transaction_date, 'YYYY-MM')")
      .orderBy('month', 'DESC');

    if (branchId) qb.andWhere('ft.branch_id = :branchId', { branchId });
    return qb.getRawMany();
  }

  async getOutstandingPayments(branchId: string | null) {
    const qb = this.invoiceRepo.createQueryBuilder('i')
      .leftJoinAndSelect('i.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .where('i.status IN (:...statuses)', { statuses: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE] });

    if (branchId) qb.andWhere('i.branch_id = :branchId', { branchId });
    return qb.orderBy('i.due_date', 'ASC').getMany();
  }

  // ─── HELPERS ───

  private async syncInvoice(invoiceId: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) return;

    const payments = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.invoice_id = :id AND p.status = :status', { id: invoiceId, status: PaymentStatus.COMPLETED })
      .getRawOne();

    const refunds = await this.refundRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.amount), 0)', 'total')
      .where('r.invoice_id = :id AND r.status = :status', { id: invoiceId, status: RefundStatus.PROCESSED })
      .getRawOne();

    const totalPaid = parseFloat(payments?.total || 0) - parseFloat(refunds?.total || 0);
    const balance = invoice.total_amount - totalPaid;

    let status = InvoiceStatus.UNPAID;
    if (balance <= 0) status = InvoiceStatus.PAID;
    else if (totalPaid > 0) status = InvoiceStatus.PARTIAL;
    if (invoice.due_date < new Date() && balance > 0) status = InvoiceStatus.OVERDUE;

    await this.invoiceRepo.update(invoiceId, {
      paid_amount: totalPaid,
      balance_due: balance,
      status,
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.invoiceRepo.count();
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateReceiptNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.paymentRepo.count();
    return `RCP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}