import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID() student_id: string;
  @IsUUID() group_id: string;

  @IsOptional() @IsNumber() @Min(0) total_fee?: number;

  @IsOptional() @IsNumber() @Min(0) discount_amount?: number;

  @IsOptional() @IsString() promo_code?: string;

  @IsOptional() @IsNumber() @Min(1) installments_count?: number;

  @IsOptional() @IsNumber() @Min(0) due_days?: number;
}
