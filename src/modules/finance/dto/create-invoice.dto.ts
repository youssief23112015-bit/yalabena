import { IsArray, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateInvoiceItemDto {
  @IsString() description: string;
  @IsOptional() @IsUUID() course_id?: string;
  @IsNumber() @Min(1) quantity: number;
  @IsNumber() @Min(0) unit_price: number;
}

export class CreateInvoiceDto {
  @IsUUID() student_id: string;
  @IsUUID() branch_id: string;
  @IsOptional() @IsUUID() enrollment_id?: string;
  @IsArray() items: CreateInvoiceItemDto[];
  @IsOptional() @IsNumber() @Min(0) discount_amount?: number;
  @IsOptional() @IsString() promo_code?: string;
  @IsOptional() @IsNumber() @Min(1) installments_count?: number;
  @IsOptional() @IsNumber() @Min(0) due_days?: number;
  @IsOptional() @IsString() notes?: string;
}
