import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class EasyKashWebhookDto {
  @IsString()
  orderId: string;

  @IsString()
  transactionId: string;

  @IsEnum(['SUCCESS', 'FAILED', 'PENDING'])
  status: 'SUCCESS' | 'FAILED' | 'PENDING';

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  signature: string;

  @IsString()
  timestamp: string;
}