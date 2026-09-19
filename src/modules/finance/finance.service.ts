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
import { InstallmentStatus } from '../../common/enums/installment-status.enum';
import { TransactionDirection } from '../../common/enums/transaction-direction.enum';
import { FinancialTransactionType } from '../../common/enums/financial-transaction-type.enum';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';

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
  ) {}

  // ─── INVOICES ───

   async createInvoice(dto: CreateInvoiceDto, userId: string, branchId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Destructure to omit 'items' from dto spread
      const { items: dtoItems, ...invoiceData } = dto;

      const invoice = this.invoiceRepo.create({
        ...invoiceData,
        invoice_number: await this.generateInvoiceNumber(),
        branch_id: branchId,
        created_by: userId,
        status: InvoiceStatus.UNPAID,
        paid_amount: 0,
        balance_due: dto.total_amount,
      });
      const saved = await queryRunner.manager.save(invoice);

      if (dtoItems?.length) {
        const items = dtoItems.map((item) =>
          this.itemRepo.create({ 
            ...item, 
            invoice_id: saved[0].id,
            item_type: item.item_type as any,
          } as any),
        );
        await queryRunner.manager.save(items);
      }

      await queryRunner.commitTransaction();
      return this.invoiceRepo.findOne({ where: { id: saved[0].id }, relations: ['items'] });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  async findInvoices(query: QueryInvoiceDto, user: any) {
    const qb = this.invoiceRepo.createQueryBuilder('i')
      .leftJoinAndSelect('i.items', 'items')
      .leftJoinAndSelect('i.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .orderBy('i.created_at', 'DESC');

    if (!user.roles?.includes('super_admin')) {
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
    if (!user.roles?.includes('super_admin') && invoice.branch_id !== user.branchId) {
      throw new ForbiddenException('Access denied');
    }
    return invoice;
  }

  // ─── PAYMENTS ───

  async recordPayment(dto: CreatePaymentDto, userId: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id: dto.invoice_id } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const payment = this.paymentRepo.create({
      ...dto,
      recorded_by: userId,
      status: PaymentStatus.COMPLETED,
      receipt_number: await this.generateReceiptNumber(),
    });
    const saved = await this.paymentRepo.save(payment);

    // Auto-sync invoice
    await this.syncInvoice(invoice.id);

    // Log transaction
    await this.ftRepo.save({
      branch_id: invoice.branch_id,
      invoice_id: invoice.id,
      payment_id: saved.id,
      transaction_type: FinancialTransactionType.PAYMENT,
      direction: TransactionDirection.IN,
      amount: dto.amount,
      transaction_date: dto.paid_at,
      description: `Payment ${saved.receipt_number}`,
      created_by: userId,
    });

    return saved;
  }

  // ─── REFUNDS ───

  async requestRefund(dto: CreateRefundDto, userId: string) {
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
    });
    return this.refundRepo.save(refund);
  }

  async processRefund(id: string, userId: string) {
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

    // Log transaction
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
    });

    return refund;
  }

  // ─── PROMO CODES ───

  async createPromoCode(dto: CreatePromoCodeDto, userId: string) {
    const promo = this.promoRepo.create({ ...dto, created_by: userId });
    return this.promoRepo.save(promo);
  }

  async validatePromoCode(code: string, courseId?: string, branchId?: string) {
    const promo = await this.promoRepo.findOne({ where: { code, status: 'active' } });
    if (!promo) throw new NotFoundException('Invalid promo code');
    if (new Date(promo.expiry_date) < new Date()) throw new BadRequestException('Promo code expired');
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      throw new BadRequestException('Promo code usage limit reached');
    }
    if (courseId && promo.applicable_courses && !promo.applicable_courses.includes(courseId)) {
      throw new BadRequestException('Promo code not applicable to this course');
    }
    if (branchId && promo.applicable_branches && !promo.applicable_branches.includes(branchId)) {
      throw new BadRequestException('Promo code not applicable to this branch');
    }
    return promo;
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