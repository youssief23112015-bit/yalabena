import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { ApproveRefundDto } from './dto/approve-refund.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/utils/branch-scope';
import { buildPdf } from '../../common/utils/pdf.helper';

@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  // ---- Invoices ----
  @Post('invoices')
  @Roles('super_admin', 'finance', 'branch_manager')
  createInvoice(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.service.createManualInvoice(dto, user);
  }

  @Get('invoices')
  @Roles('super_admin', 'finance', 'branch_manager')
  listInvoices(@Query() dto: QueryInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.service.listInvoices(dto, user);
  }

  @Get('invoices/:id')
  @Roles('super_admin', 'finance', 'branch_manager')
  getInvoice(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.getInvoice(id, user);
  }

  // ---- Promo codes ----
  @Post('promo-codes')
  @Roles('super_admin', 'finance', 'branch_manager')
  createPromo(@Body() dto: CreatePromoCodeDto, @CurrentUser() user: AuthUser) {
    return this.service.createPromo(dto, user);
  }

  @Get('promo-codes')
  @Roles('super_admin', 'finance', 'branch_manager', 'sales')
  listPromos() {
    return this.service.listPromos();
  }

  @Post('promo-codes/:id/status')
  @Roles('super_admin', 'finance', 'branch_manager')
  setPromoStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: 'active' | 'inactive') {
    return this.service.setPromoStatus(id, status);
  }

  // ---- Payments ----
  @Post('payments')
  @Roles('super_admin', 'finance', 'branch_manager')
  recordPayment(@Body() dto: CreatePaymentDto, @CurrentUser() user: AuthUser) {
    return this.service.recordPayment(dto, user);
  }

  @Get('payments')
  @Roles('super_admin', 'finance', 'branch_manager')
  listPayments(
    @CurrentUser() user: AuthUser,
    @Query('invoice_id') invoice_id?: string,
    @Query('branch_id') branch_id?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listPayments(user, { invoice_id, branch_id, from, to });
  }

  @Get('payments/:id')
  @Roles('super_admin', 'finance', 'branch_manager')
  getPayment(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.getPayment(id, user);
  }

  @Get('payments/:id/receipt.pdf')
  @Roles('super_admin', 'finance', 'branch_manager')
  async receiptPdf(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser, @Res() res: Response) {
    const p: any = await this.service.getPayment(id, user);
    const inv = p.invoice;
    const studentName = inv?.student?.user
      ? `${inv.student.user.first_name} ${inv.student.user.last_name}`
      : '';
    const buf = await buildPdf({
      texts: [
        { text: 'Speak Up English Academy', size: 20, y: 60 },
        { text: 'Payment Receipt', size: 16, y: 110, color: '#444444' },
        { text: `Receipt No: ${p.receipt_number ?? p.id}`, size: 12, y: 160 },
        { text: `Invoice: ${inv?.invoice_number ?? '-'}`, size: 12, y: 190 },
        { text: `Student: ${studentName}`, size: 12, y: 220 },
        { text: `Amount: ${p.amount} EGP   Method: ${p.method}`, size: 14, y: 270 },
        { text: `Date: ${new Date(p.paid_at).toLocaleDateString('en-GB')}`, size: 12, y: 300 },
        ...(p.reference ? [{ text: `Reference: ${p.reference}`, size: 11, y: 330 }] : []),
      ],
    });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="receipt-${p.receipt_number ?? id}.pdf"` });
    res.send(buf);
  }

  // ---- Refunds ----
  @Post('refunds')
  @Roles('super_admin', 'finance')
  createRefund(@Body() dto: CreateRefundDto, @CurrentUser() user: AuthUser) {
    return this.service.createRefund(dto, user);
  }

  @Get('refunds')
  @Roles('super_admin', 'finance', 'branch_manager')
  listRefunds(@CurrentUser() user: AuthUser, @Query('status') status?: string, @Query('branch_id') branch_id?: string) {
    return this.service.listRefunds(user, { status, branch_id });
  }

  @Post('refunds/:id/decision')
  @Roles('super_admin', 'finance')
  decideRefund(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ApproveRefundDto, @CurrentUser() user: AuthUser) {
    return this.service.decideRefund(id, dto.action, dto.note, user);
  }

  @Post('refunds/:id/process')
  @Roles('super_admin', 'finance')
  processRefund(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.processRefund(id, user);
  }

  // ---- Ledger / receivables ----
  @Get('ledger')
  @Roles('super_admin', 'finance', 'branch_manager')
  ledger(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branch_id') branch_id?: string,
  ) {
    return this.service.ledger(user, from, to, branch_id);
  }

  @Get('receivables')
  @Roles('super_admin', 'finance', 'branch_manager')
  receivables(@CurrentUser() user: AuthUser, @Query('branch_id') branch_id?: string) {
    return this.service.receivables(user, branch_id);
  }
}
