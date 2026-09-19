import { IsUUID, IsNumber, IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../../common/enums/payment-method.enum';

export class CreatePaymentDto {
  @ApiProperty() @IsUUID() invoice_id: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty({ enum: PaymentMethod }) @IsEnum(PaymentMethod) method: PaymentMethod;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() easykash_transaction_id?: string;
  @ApiProperty() @IsDateString() paid_at: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
