import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../../shared/entities/invoice.entity';
import { Payment } from '../../shared/entities/payment.entity';
import { Installment } from '../../shared/entities/installment.entity';
import { Refund } from '../../shared/entities/refund.entity';
import { PromoCode } from '../../shared/entities/promo-code.entity';
import { FinancialTransaction } from '../../shared/entities/financial-transaction.entity';
import { InvoiceItem } from '../../shared/entities/invoice-item.entity';
import { Enrollment } from '../../shared/entities/enrollment.entity';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    Invoice, Payment, Installment, Refund, PromoCode, 
    FinancialTransaction, InvoiceItem, Enrollment
  ])],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
