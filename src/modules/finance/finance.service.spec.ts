import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { RefundStatus } from '../../common/enums/refund-status.enum';
import { TransactionDirection } from '../../common/enums/transaction-direction.enum';
import { FinancialTransactionType } from '../../common/enums/financial-transaction-type.enum';

/** Chainable QueryBuilder stub that resolves getRawOne() to `raw`. */
const rawQb = (raw: any) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue(raw),
  getRawMany: jest.fn().mockResolvedValue([]),
  getMany: jest.fn().mockResolvedValue([]),
});

describe('FinanceService', () => {
  let service: FinanceService;
  let invoiceRepo: any;
  let paymentRepo: any;
  let installmentRepo: any;
  let refundRepo: any;
  let promoRepo: any;
  let ftRepo: any;
  let itemRepo: any;

  const invoice = {
    id: 'inv-1',
    branch_id: 'b-1',
    total_amount: 1000,
    due_date: new Date(Date.now() + 86400_000),
    status: InvoiceStatus.UNPAID,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    invoiceRepo = {
      findOne: jest.fn(),
      update: jest.fn(async () => undefined),
      count: jest.fn(async () => 0),
      create: jest.fn((x: any) => x),
      createQueryBuilder: jest.fn(),
    };
    paymentRepo = {
      findOne: jest.fn(),
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => ({ id: 'pay-1', ...x })),
      count: jest.fn(async () => 4),
      createQueryBuilder: jest.fn(),
    };
    installmentRepo = { create: jest.fn((x: any) => x), save: jest.fn(async (x: any) => x) };
    refundRepo = {
      findOne: jest.fn(),
      create: jest.fn((x: any) => x),
      save: jest.fn(async (x: any) => ({ id: 'ref-1', ...x })),
      createQueryBuilder: jest.fn(),
    };
    promoRepo = { findOne: jest.fn(), create: jest.fn((x: any) => x), save: jest.fn(async (x: any) => x) };
    ftRepo = { save: jest.fn(async (x: any) => x), createQueryBuilder: jest.fn() };
    itemRepo = { create: jest.fn((x: any) => x) };
    service = new FinanceService(
      invoiceRepo, paymentRepo, installmentRepo, refundRepo,
      promoRepo, ftRepo, itemRepo, {} as any,
    );
  });

  describe('recordPayment', () => {
    const dto: any = { invoice_id: 'inv-1', amount: 1000, paid_at: new Date(), method: 'cash' };

    it('throws NotFoundException for an unknown invoice', async () => {
      invoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.recordPayment(dto, 'admin-1')).rejects.toThrow(NotFoundException);
      expect(paymentRepo.save).not.toHaveBeenCalled();
    });

    it('saves a completed payment, syncs the invoice, and logs an IN transaction', async () => {
      invoiceRepo.findOne.mockResolvedValue({ ...invoice });
      paymentRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '1000' }));
      refundRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '0' }));

      const res = await service.recordPayment(dto, 'admin-1');

      expect(paymentRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          invoice_id: 'inv-1',
          status: PaymentStatus.COMPLETED,
          receipt_number: expect.stringMatching(/^RCP-\d{4}-0005$/),
          recorded_by: 'admin-1',
        }),
      );
      // syncInvoice: 1000 paid on a 1000 invoice → PAID, balance 0
      expect(invoiceRepo.update).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({
          paid_amount: 1000,
          balance_due: 0,
          status: InvoiceStatus.PAID,
        }),
      );
      expect(ftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction_type: FinancialTransactionType.PAYMENT,
          direction: TransactionDirection.IN,
          amount: 1000,
          invoice_id: 'inv-1',
        }),
      );
      expect(res.id).toBe('pay-1');
    });

    it('marks the invoice PARTIAL when only part is paid', async () => {
      invoiceRepo.findOne.mockResolvedValue({ ...invoice });
      paymentRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '400' }));
      refundRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '0' }));

      await service.recordPayment({ ...dto, amount: 400 }, 'admin-1');

      expect(invoiceRepo.update).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({ paid_amount: 400, balance_due: 600, status: InvoiceStatus.PARTIAL }),
      );
    });

    it('marks the invoice OVERDUE when past due with balance remaining', async () => {
      invoiceRepo.findOne.mockResolvedValue({
        ...invoice,
        due_date: new Date(Date.now() - 86400_000),
      });
      paymentRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '0' }));
      refundRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '0' }));

      await service.recordPayment({ ...dto, amount: 0 }, 'admin-1');

      expect(invoiceRepo.update).toHaveBeenCalledWith(
        'inv-1',
        expect.objectContaining({ status: InvoiceStatus.OVERDUE }),
      );
    });
  });

  describe('requestRefund', () => {
    const payment = { id: 'pay-1', invoice_id: 'inv-1', amount: 1000 };
    const dto: any = { payment_id: 'pay-1', amount: 300, reason_code: 'course_cancelled' };

    it('throws NotFoundException for an unknown payment', async () => {
      paymentRepo.findOne.mockResolvedValue(null);
      await expect(service.requestRefund(dto, 'u-1')).rejects.toThrow(NotFoundException);
    });

    it('rejects a refund that exceeds the original payment', async () => {
      paymentRepo.findOne.mockResolvedValue(payment);
      refundRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '800' }));
      await expect(service.requestRefund(dto, 'u-1')).rejects.toThrow(BadRequestException);
      expect(refundRepo.save).not.toHaveBeenCalled();
    });

    it('creates a PENDING refund within the remaining refundable amount', async () => {
      paymentRepo.findOne.mockResolvedValue(payment);
      refundRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '500' }));

      const res = await service.requestRefund(dto, 'u-1');
      expect(refundRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          invoice_id: 'inv-1',
          amount: 300,
          status: RefundStatus.PENDING,
        }),
      );
      expect(res.status).toBe(RefundStatus.PENDING);
    });
  });

  describe('processRefund', () => {
    it('rejects refunds that are not approved yet', async () => {
      refundRepo.findOne.mockResolvedValue({ id: 'ref-1', status: RefundStatus.PENDING });
      await expect(service.processRefund('ref-1', 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('marks approved refunds PROCESSED and logs an OUT transaction', async () => {
      refundRepo.findOne.mockResolvedValue({
        id: 'ref-1',
        status: RefundStatus.APPROVED,
        invoice_id: 'inv-1',
        amount: 300,
        reason_code: 'course_cancelled',
      });
      invoiceRepo.findOne.mockResolvedValue({ ...invoice });
      paymentRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '1000' }));
      refundRepo.createQueryBuilder.mockReturnValue(rawQb({ total: '300' }));

      const res = await service.processRefund('ref-1', 'admin-1');

      expect(refundRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: RefundStatus.PROCESSED,
          processed_by: 'admin-1',
          processed_at: expect.any(Date),
        }),
      );
      expect(ftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction_type: FinancialTransactionType.REFUND,
          direction: TransactionDirection.OUT,
          amount: 300,
          refund_id: 'ref-1',
        }),
      );
      expect(res.status).toBe(RefundStatus.PROCESSED);
    });
  });

  describe('validatePromoCode', () => {
    const activePromo = {
      id: 'promo-1',
      code: 'SAVE20',
      status: 'active',
      expiry_date: new Date(Date.now() + 86400_000),
      usage_limit: 10,
      used_count: 3,
      applicable_courses: null,
      applicable_branches: null,
    };

    it('rejects unknown codes', async () => {
      promoRepo.findOne.mockResolvedValue(null);
      await expect(service.validatePromoCode('NOPE')).rejects.toThrow(NotFoundException);
    });

    it('rejects expired codes', async () => {
      promoRepo.findOne.mockResolvedValue({
        ...activePromo,
        expiry_date: new Date(Date.now() - 86400_000),
      });
      await expect(service.validatePromoCode('SAVE20')).rejects.toThrow(BadRequestException);
    });

    it('rejects codes past their usage limit', async () => {
      promoRepo.findOne.mockResolvedValue({ ...activePromo, used_count: 10 });
      await expect(service.validatePromoCode('SAVE20')).rejects.toThrow(BadRequestException);
    });

    it('rejects codes not applicable to the given course', async () => {
      promoRepo.findOne.mockResolvedValue({ ...activePromo, applicable_courses: ['c-2'] });
      await expect(service.validatePromoCode('SAVE20', 'c-1')).rejects.toThrow(BadRequestException);
    });

    it('returns the promo for a valid code', async () => {
      promoRepo.findOne.mockResolvedValue({ ...activePromo, applicable_courses: ['c-1'] });
      const res = await service.validatePromoCode('SAVE20', 'c-1');
      expect(res.code).toBe('SAVE20');
    });
  });

  describe('getInvoice — branch isolation', () => {
    it('throws NotFoundException for missing invoice', async () => {
      invoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.getInvoice('inv-x', { roles: ['super_admin'] })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('forbids cross-branch access for non-super-admins', async () => {
      invoiceRepo.findOne.mockResolvedValue({ ...invoice, branch_id: 'b-other' });
      await expect(
        service.getInvoice('inv-1', { roles: ['branch_manager'], branchId: 'b-1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows super_admin across branches', async () => {
      invoiceRepo.findOne.mockResolvedValue({ ...invoice, branch_id: 'b-other' });
      const res = await service.getInvoice('inv-1', { roles: ['super_admin'] });
      expect(res.id).toBe('inv-1');
    });
  });
});

