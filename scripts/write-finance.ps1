$content = @'
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from '../../../shared/entities/payment.entity';
import { Invoice } from '../../../shared/entities/invoice.entity';
import { Enrollment } from '../../../shared/entities/enrollment.entity';
import { Refund } from '../../../shared/entities/refund.entity';
import { FinancialTransaction } from '../../../shared/entities/financial-transaction.entity';
import { Installment } from '../../../shared/entities/installment.entity';
import { PromoCode } from '../../../shared/entities/promo-code.entity';
import { PayrollPeriod } from '../../../shared/entities/payroll-period.entity';
import { Group } from '../../../shared/entities/group.entity';
import { Course } from '../../../shared/entities/course.entity';
import { BaseMetricService } from './base-metric.service';
import { AuthUser } from '../../../common/utils/branch-scope';
import { DashboardQueryDto, KpiResult, AlertItem, TimeSeriesPoint } from '../dashboard.dto';
import { PeriodResolver } from './period.util';
import { toMoney } from './trend.util';

@Injectable()
export class FinanceMetricService extends BaseMetricService {
  constructor(
    config: ConfigService,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Invoice) private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Refund) private readonly refundRepo: Repository<Refund>,
    @InjectRepository(FinancialTransaction) private readonly ftRepo: Repository<FinancialTransaction>,
    @InjectRepository(Installment) private readonly installmentRepo: Repository<Installment>,
    @InjectRepository(PromoCode) private readonly promoRepo: Repository<PromoCode>,
    @InjectRepository(PayrollPeriod) private readonly payrollPeriodRepo: Repository<PayrollPeriod>,
    @InjectRepository(Group) private readonly groupRepo: Repository<Group>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    private readonly periodResolver: PeriodResolver,
  ) {
    super(config);
  }
'@

$content | Out-File -FilePath "c:\Users\WinDows\Desktop\yalabena-main\src\modules\dashboard\metrics\finance-metric.service.ts" -Encoding UTF8
Write-Output "Part 1 done"