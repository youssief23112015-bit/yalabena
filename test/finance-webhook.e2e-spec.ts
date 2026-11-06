import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createHmac } from 'crypto';
import * as bcrypt from 'bcrypt';
import { json } from 'express';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/shared/entities/user.entity';
import { Role } from '../src/shared/entities/role.entity';
import { UserRole } from '../src/shared/entities/user-role.entity';
import { Student } from '../src/shared/entities/student.entity';
import { Invoice } from '../src/shared/entities/invoice.entity';
import { Payment } from '../src/shared/entities/payment.entity';
import { Refund } from '../src/shared/entities/refund.entity';
import { PaymentStatus } from '../src/common/enums/payment-status.enum';
import { PaymentMethod } from '../src/common/enums/payment-method.enum';
import { InvoiceStatus } from '../src/common/enums/invoice-status.enum';
import { UserStatus } from '../src/common/enums/user-status.enum';
import { StudentStatus } from '../src/common/enums/student-status.enum';

/**
 * E2E Integration Test Suite — Finance & Webhook Security
 *
 * Validates:
 *   1. Webhook fail-closed & HMAC signature verification (EasyKash / Zoom)
 *   2. Financial transaction integrity & overpayment protection
 *   3. Pessimistic row-locking under concurrent payment/refund requests
 *
 * Prerequisites:
 *   - A running PostgreSQL instance configured via the standard .env
 *     (or environment variables) that the AppModule connects to.
 *   - Run with:  npx jest --config test/jest-e2e.json
 */
describe('Finance & Webhook Security (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let roleRepo: Repository<Role>;
  let userRoleRepo: Repository<UserRole>;
  let studentRepo: Repository<Student>;
  let invoiceRepo: Repository<Invoice>;
  let paymentRepo: Repository<Payment>;
  let refundRepo: Repository<Refund>;

  let authToken: string;
  let financeUserId: string;
  let studentId: string;
  let invoiceId: string;
  let paymentId: string;

  const WEBHOOK_SECRET = 'e2e-test-webhook-secret-12345';
  const API_V1 = '/api/v1';

  /** Compute HMAC-SHA256 signature for a raw body string. */
  const computeSignature = (rawBody: string, secret = WEBHOOK_SECRET): string =>
    createHmac('sha256', secret).update(rawBody).digest('hex');

  /** Build an EasyKash-style webhook payload and return { rawBody, signature, payload }. */
  const buildEasyKashWebhook = (
    reference: string,
    status: string = 'SUCCESS',
    amount: number = 100,
    tamper: boolean = false,
  ) => {
    const payload = {
      orderId: `ord-${reference}`,
      transactionId: `txn-${reference}`,
      status,
      amount,
      currency: 'EGP',
      timestamp: new Date().toISOString(),
    };
    const rawBody = JSON.stringify(payload);
    const sig = computeSignature(rawBody);
    return { rawBody, signature: tamper ? sig + '00' : sig, payload };
  };

  beforeAll(async () => {
    process.env.EASYKASH_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    // Expose req.rawBody so the webhook signature verification can be tested
    // end-to-end (mirrors the production body-parser verify hook).
    app.use(
      json({
        verify: (req: any, _res: any, buf: Buffer) => {
          req.rawBody = buf.toString();
        },
      }),
    );

    await app.init();

    userRepo = moduleFixture.get(getRepositoryToken(User));
    roleRepo = moduleFixture.get(getRepositoryToken(Role));
    userRoleRepo = moduleFixture.get(getRepositoryToken(UserRole));
    studentRepo = moduleFixture.get(getRepositoryToken(Student));
    invoiceRepo = moduleFixture.get(getRepositoryToken(Invoice));
    paymentRepo = moduleFixture.get(getRepositoryToken(Payment));
    refundRepo = moduleFixture.get(getRepositoryToken(Refund));

    await seedDatabase();
    authToken = await loginFinanceUser();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── helpers ──
  const loginFinanceUser = async (): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post(`${API_V1}/auth/login`)
      .send({ email: 'finance@speakup.test', password: 'Secret123!' })
      .expect(200);
    return res.body.access_token;
  };

  const seedDatabase = async () => {
    // Clean slate (test isolation)
    await refundRepo.delete({});
    await paymentRepo.delete({});
    await invoiceRepo.delete({});
    await studentRepo.delete({});
    await userRoleRepo.delete({});
    await userRepo.delete({});

    // Ensure roles exist
    let financeRole = await roleRepo.findOne({ where: { slug: 'finance' } });
    if (!financeRole) {
      financeRole = roleRepo.create({ name: 'Finance', slug: 'finance' });
      await roleRepo.save(financeRole);
    }
    let studentRole = await roleRepo.findOne({ where: { slug: 'student' } });
    if (!studentRole) {
      studentRole = roleRepo.create({ name: 'Student', slug: 'student' });
      await roleRepo.save(studentRole);
    }

    // Create finance user with a known password
    const passwordHash = await bcrypt.hash('Secret123!', 10);
    const financeUser = userRepo.create({
      email: 'finance@speakup.test',
      password_hash: passwordHash,
      first_name: 'Finance',
      last_name: 'User',
      status: UserStatus.ACTIVE,
    });
    const savedUser = await userRepo.save(financeUser);
    financeUserId = savedUser.id;

    await userRoleRepo.save(
      userRoleRepo.create({ user_id: financeUserId, role_id: financeRole.id }),
    );

    // Create student
    const studentEntity = studentRepo.create({
      user_id: financeUserId,
      student_number: 'STU-E2E-001',
      status: StudentStatus.ACTIVE,
    });
    const savedStudent = await studentRepo.save(studentEntity);
    studentId = savedStudent.id;

    // Create an invoice with balance_due = 100.00 EGP
    const invoice = invoiceRepo.create({
      student_id: studentId,
      invoice_number: 'INV-E2E-0001',
      subtotal: 100,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: 100,
      paid_amount: 0,
      balance_due: 100,
      status: InvoiceStatus.UNPAID,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      created_by: financeUserId,
    });
    const savedInvoice = await invoiceRepo.save(invoice);
    invoiceId = savedInvoice.id;
  };

  // =========================================================================
  // 1. WEBHOOK SECURITY — FAIL-CLOSED & HMAC SIGNATURES
  // =========================================================================

  describe('POST /integrations/easykash/webhook — signature security', () => {
    const webhookPath = `${API_V1}/integrations/easykash/webhook`;

    it('rejects webhook with missing x-signature header → 401', async () => {
      const { rawBody, payload } = buildEasyKashWebhook('ref-missing-sig');
      await request(app.getHttpServer())
        .post(webhookPath)
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(401);
    });

    it('rejects webhook with forged/invalid x-signature → 401', async () => {
      const { rawBody, payload } = buildEasyKashWebhook('ref-forged-sig');
      await request(app.getHttpServer())
        .post(webhookPath)
        .set('Content-Type', 'application/json')
        .set('x-signature', computeSignature(rawBody, 'wrong-secret'))
        .send(payload)
        .expect(401);
    });

    it('rejects webhook with tampered signature → 401', async () => {
      const { rawBody, signature, payload } = buildEasyKashWebhook('ref-tampered-sig', 'SUCCESS', 100, true);
      await request(app.getHttpServer())
        .post(webhookPath)
        .set('Content-Type', 'application/json')
        .set('x-signature', signature) // tampered sig from builder
        .send(payload)
        .expect(401);
    });

    it('accepts webhook with valid HMAC signature → 200', async () => {
      const reference = `ref-valid-${Date.now()}`;
      const { rawBody, signature, payload } = buildEasyKashWebhook(reference);

      // Pre-create a pending payment that the webhook can match
      const payment = paymentRepo.create({
        invoice_id: invoiceId,
        amount: 100,
        method: PaymentMethod.EASykASH,
        status: PaymentStatus.PENDING,
        paid_at: new Date(),
        easykash_transaction_id: reference,
        notes: 'easykash-checkout',
        recorded_by: financeUserId,
      });
      await paymentRepo.save(payment);

      const res = await request(app.getHttpServer())
        .post(webhookPath)
        .set('Content-Type', 'application/json')
        .set('x-signature', signature)
        .send(payload)
        .expect(200);

      expect(res.body.updated).toBe(true);

      // Verify the payment status was updated atomically
      const updated = await paymentRepo.findOne({ where: { id: payment.id } });
      expect(updated?.status).toBe(PaymentStatus.COMPLETED);
    });

    it('rejects webhook when EASYKASH_WEBHOOK_SECRET is not configured (fail-closed)', async () => {
      const originalSecret = process.env.EASYKASH_WEBHOOK_SECRET;
      delete process.env.EASYKASH_WEBHOOK_SECRET;

      try {
        const { rawBody, payload } = buildEasyKashWebhook('ref-no-secret');
        await request(app.getHttpServer())
          .post(webhookPath)
          .set('Content-Type', 'application/json')
          .set('x-signature', computeSignature(rawBody, 'anything'))
          .send(payload)
          .expect(401);
      } finally {
        process.env.EASYKASH_WEBHOOK_SECRET = originalSecret;
      }
    });
  });

  // =========================================================================
  // 2. FINANCIAL TRANSACTION INTEGRITY — OVERPAYMENT PROTECTION
  // =========================================================================

  describe('POST /finance/payments — overpayment protection', () => {
    it('rejects a payment exceeding the invoice balance_due → 400', async () => {
      // Fresh invoice with balance_due = 100
      const inv = await invoiceRepo.save(
        invoiceRepo.create({
          student_id: studentId,
          invoice_number: `INV-OVER-${Date.now()}`,
          subtotal: 100,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: 100,
          paid_amount: 0,
          balance_due: 100,
          status: InvoiceStatus.UNPAID,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_by: financeUserId,
        }),
      );

      await request(app.getHttpServer())
        .post(`${API_V1}/finance/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoice_id: inv.id,
          amount: 150, // exceeds balance_due (100)
          method: 'CASH',
          reference: 'RCP-OVER-001',
        })
        .expect(400);

      // Invoice must remain UNPAID with balance_due unchanged
      const unchanged = await invoiceRepo.findOne({ where: { id: inv.id } });
      expect(unchanged?.balance_due).toBe(100);
      expect(unchanged?.status).toBe(InvoiceStatus.UNPAID);
    });

    it('accepts a payment equal to balance_due and marks invoice PAID → 201', async () => {
      const inv = await invoiceRepo.save(
        invoiceRepo.create({
          student_id: studentId,
          invoice_number: `INV-EXACT-${Date.now()}`,
          subtotal: 100,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: 100,
          paid_amount: 0,
          balance_due: 100,
          status: InvoiceStatus.UNPAID,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_by: financeUserId,
        }),
      );

      await request(app.getHttpServer())
        .post(`${API_V1}/finance/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoice_id: inv.id,
          amount: 100, // exactly balance_due
          method: 'CASH',
          reference: `RCP-EXACT-${Date.now()}`,
        })
        .expect(201);

      const updated = await invoiceRepo.findOne({ where: { id: inv.id } });
      expect(updated?.balance_due).toBe(0);
      expect(updated?.status).toBe(InvoiceStatus.PAID);
    });

    it('accepts a partial payment and marks invoice PARTIAL → 201', async () => {
      const inv = await invoiceRepo.save(
        invoiceRepo.create({
          student_id: studentId,
          invoice_number: `INV-PART-${Date.now()}`,
          subtotal: 100,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: 100,
          paid_amount: 0,
          balance_due: 100,
          status: InvoiceStatus.UNPAID,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_by: financeUserId,
        }),
      );

      await request(app.getHttpServer())
        .post(`${API_V1}/finance/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invoice_id: inv.id,
          amount: 40, // partial
          method: 'CASH',
          reference: `RCP-PART-${Date.now()}`,
        })
        .expect(201);

      const updated = await invoiceRepo.findOne({ where: { id: inv.id } });
      expect(updated?.balance_due).toBe(60);
      expect(updated?.status).toBe(InvoiceStatus.PARTIAL);
    });
  });

  // =========================================================================
  // 3. CONCURRENT PAYMENT / REFUND — PESSIMISTIC ROW-LOCKING
  // =========================================================================

  describe('Concurrent payments — race condition prevention', () => {
    it('prevents double-spending when two concurrent payments exceed combined balance', async () => {
      // Invoice with balance_due = 100
      const inv = await invoiceRepo.save(
        invoiceRepo.create({
          student_id: studentId,
          invoice_number: `INV-CONC-${Date.now()}`,
          subtotal: 100,
          discount_amount: 0,
          tax_amount: 0,
          total_amount: 100,
          paid_amount: 0,
          balance_due: 100,
          status: InvoiceStatus.UNPAID,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_by: financeUserId,
        }),
      );

      const paymentDto = (ref: string) => ({
        invoice_id: inv.id,
        amount: 60, // each payment is 60; combined 120 > 100
        method: 'CASH',
        reference: ref,
      });

      // Fire both concurrently — pessimistic row lock serializes them
      const results = await Promise.all([
        request(app.getHttpServer())
          .post(`${API_V1}/finance/payments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentDto('RCP-CONC-1')),
        request(app.getHttpServer())
          .post(`${API_V1}/finance/payments`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(paymentDto('RCP-CONC-2')),
      ]);

      const statuses = results.map((r) => r.status);
      // Exactly one should succeed (201), the other should be rejected (400)
      expect(statuses).toEqual(expect.arrayContaining([201]));
      expect(statuses.filter((s) => s === 201).length).toBe(1);
      expect(statuses.filter((s) => s === 400).length).toBe(1);

      // Invoice balance must be exactly 40 (one successful 60 payment)
      const final = await invoiceRepo.findOne({ where: { id: inv.id } });
      expect(final?.balance_due).toBe(40);
      expect(final?.paid_amount).toBe(60);
    });
  });

  describe('Concurrent refunds — race condition prevention', () => {
    it('prevents double-refund when two concurrent refunds exceed the payment amount', async () => {
      // Create a completed payment of 100
      const payment = await paymentRepo.save(
        paymentRepo.create({
          invoice_id: invoiceId,
          amount: 100,
          method: PaymentMethod.CASH,
          status: PaymentStatus.COMPLETED,
          paid_at: new Date(),
          reference: `RCP-REFUND-${Date.now()}`,
          recorded_by: financeUserId,
        }),
      );
      paymentId = payment.id;

      const refundDto = (ref: string) => ({
        payment_id: payment.id,
        amount: 60, // each refund 60; combined 120 > 100
        reason_code: 'customer_request',
        reason_note: ref,
      });

      const results = await Promise.all([
        request(app.getHttpServer())
          .post(`${API_V1}/finance/refunds`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(refundDto('REF-1')),
        request(app.getHttpServer())
          .post(`${API_V1}/finance/refunds`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(refundDto('REF-2')),
      ]);

      const statuses = results.map((r) => r.status);
      // Exactly one refund should succeed (201), the other rejected (400)
      expect(statuses.filter((s) => s === 201).length).toBe(1);
      expect(statuses.filter((s) => s === 400).length).toBe(1);

      // Total refunded must not exceed the original payment amount (100)
      const totalRefunded = await refundRepo
        .createQueryBuilder('r')
        .select('COALESCE(SUM(r.amount), 0)', 'total')
        .where('r.payment_id = :pid AND r.status IN (:...statuses)', {
          pid: payment.id,
          statuses: ['pending', 'approved', 'processed'],
        })
        .getRawOne();

      expect(parseFloat(totalRefunded?.total || 0)).toBeLessThanOrEqual(100);
    });
  });
});
