import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../../shared/entities/invoice.entity';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser, isSuperAdmin } from '../../common/utils/auth-user';
import { EasyKashService } from './easykash.service';
import { EasyKashCheckoutDto } from './dto/easykash-checkout.dto';

/**
 * Authenticated payment-operations routes (SRS §5.3). Lives in the
 * Integrations module (reuses its EasyKashService + Invoice repository)
 * but under its own `payments` controller prefix so the endpoint resolves
 * to exactly POST /payments/easykash/checkout — the existing controllers'
 * prefixes (integrations/, finance/) would produce the wrong path.
 * Authentication comes from the global JwtAuthGuard (no @Public here).
 */
@ApiTags('Payments')
@ApiBearerAuth('JWT')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly easykash: EasyKashService,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
  ) {}

  @Post('easykash/checkout')
  @ApiOperation({
    summary: 'Create an EasyKash checkout session for an invoice and return the redirect URL',
  })
  async checkout(
    @Body() dto: EasyKashCheckoutDto,
    @CurrentUser() user: AuthUser,
  ) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: dto.invoice_id },
      relations: ['student', 'student.user'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // Ownership validation before touching the gateway.
    const callerId = user.userId ?? user.id;
    const isStudentRole = (user.roles ?? []).includes('student');
    if (isStudentRole && !isSuperAdmin(user)) {
      // Students may only check out their OWN invoices.
      if (invoice.student?.user_id !== callerId) {
        throw new ForbiddenException('You can only pay your own invoices');
      }
    }

    const balance = Number(invoice.balance_due ?? invoice.total_amount ?? 0);
    if (invoice.status === InvoiceStatus.PAID || balance <= 0) {
      throw new BadRequestException('Invoice is already fully paid');
    }

    const { payment_url, reference } = await this.easykash.createCheckoutSession({
      invoiceId: invoice.id,
      amount: balance,
      customerEmail: invoice.student?.user?.email ?? '',
    });

    // Redirect URL consumed by the frontend to open the hosted payment page.
    return { invoice_id: invoice.id, payment_url, reference };
  }
}