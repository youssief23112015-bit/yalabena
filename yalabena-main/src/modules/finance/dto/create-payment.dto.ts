import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID() invoice_id: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsIn(['CASH', 'BANK_TRANSFER', 'EASYKASH']) method: 'CASH' | 'BANK_TRANSFER' | 'EASYKASH';
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() notes?: string;
}
