import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { ApproveRefundDto } from './dto/approve-refund.dto';

@ApiTags('Finance')
@ApiBearerAuth('JWT')
@Controller('finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  // Invoices
  @Post('invoices')
  @Roles('super_admin', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'Create invoice' })
  createInvoice(@Body() dto: CreateInvoiceDto, @CurrentUser() user: any) {
    return this.service.createInvoice(dto, user.userId, user.branchId);
  }

  @Get('invoices')
  @Roles('super_admin', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'List invoices' })
  findInvoices(@Query() query: QueryInvoiceDto, @CurrentUser() user: any) {
    return this.service.findInvoices(query, user);
  }

  @Get('invoices/:id')
  @Roles('super_admin', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'Get invoice details' })
  getInvoice(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.getInvoice(id, user);
  }

  // Payments
  @Post('payments')
  @Roles('super_admin', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'Record payment' })
  recordPayment(@Body() dto: CreatePaymentDto, @CurrentUser() user: any) {
    return this.service.recordPayment(dto, user.userId);
  }

  // Refunds
  @Post('refunds')
  @Roles('super_admin', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'Request refund' })
  requestRefund(@Body() dto: CreateRefundDto, @CurrentUser() user: any) {
    return this.service.requestRefund(dto, user.userId);
  }

  @Put('refunds/:id/approve')
  @Roles('super_admin', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'Approve refund' })
  approveRefund(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.requestRefund({ ...new CreateRefundDto(), payment_id: id }, user.userId);
  }

  @Put('refunds/:id/process')
  @Roles('super_admin', 'finance')
  @ApiOperation({ summary: 'Process refund' })
  processRefund(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.processRefund(id, user.userId);
  }

  // Promo Codes
  @Post('promo-codes')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Create promo code' })
  createPromoCode(@Body() dto: CreatePromoCodeDto, @CurrentUser() user: any) {
    return this.service.createPromoCode(dto, user.userId);
  }

  @Get('promo-codes/validate')
  @ApiOperation({ summary: 'Validate promo code' })
  validatePromoCode(@Query('code') code: string, @Query('courseId') courseId?: string) {
    return this.service.validatePromoCode(code, courseId);
  }

  // Reports
  @Get('reports/revenue')
  @Roles('super_admin', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'Revenue report' })
  getRevenueReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: any,
  ) {
    const branchId = user.roles?.includes('super_admin') ? null : user.branchId;
    return this.service.getRevenueReport(branchId, new Date(from), new Date(to));
  }

  @Get('reports/outstanding')
  @Roles('super_admin', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'Outstanding payments' })
  getOutstanding(@CurrentUser() user: any) {
    const branchId = user.roles?.includes('super_admin') ? null : user.branchId;
    return this.service.getOutstandingPayments(branchId);
  }
}
