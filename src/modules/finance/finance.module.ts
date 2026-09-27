import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { Invoice } from '../../shared/entities/invoice.entity';
import { InvoiceItem } from '../../shared/entities/invoice-item.entity';
import { Payment } from '../../shared/entities/payment.entity';
import { Installment } from '../../shared/entities/installment.entity';
import { Refund } from '../../shared/entities/refund.entity';
import { PromoCode } from '../../shared/entities/promo-code.entity';
import { Student } from '../../shared/entities/student.entity';
import { FinancialTransaction } from '../../shared/entities/financial-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem, Payment, Installment, Refund, PromoCode, Student, FinancialTransaction])],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
