import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryInvoiceDto {
  @IsOptional() @IsUUID() student_id?: string;
  @IsOptional() @IsUUID() branch_id?: string;
  @IsOptional() @IsIn(['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED', 'OVERDUE']) status?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
  @IsOptional() @IsString() due_from?: string;
  @IsOptional() @IsString() due_to?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) offset?: number = 0;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) limit?: number = 20;
}