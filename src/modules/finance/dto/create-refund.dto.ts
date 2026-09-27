import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateRefundDto {
  @IsUUID() payment_id: string;
  @IsNumber() @Min(0.01) amount: number;
  @IsString() reason_code: string; // must be a valid RefundReason enum value (frontend dropdown)
  @IsOptional() @IsString() reason_note?: string;
}
