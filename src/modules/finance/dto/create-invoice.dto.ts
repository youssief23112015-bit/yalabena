import { IsUUID, IsNumber, IsOptional, IsString, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class InvoiceItemDto {
  @ApiProperty() @IsString() item_type: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() course_id?: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ default: 1 }) @IsNumber() quantity: number;
  @ApiProperty({ default: 0 }) @IsNumber() unit_price: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() discount_amount?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() tax_amount?: number;
  @ApiProperty() @IsNumber() total_amount: number;
}

export class CreateInvoiceDto {
  @ApiProperty() @IsUUID() enrollment_id: string;
  @ApiProperty() @IsUUID() student_id: string;
  @ApiProperty() @IsNumber() subtotal: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() discount_amount?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsNumber() tax_amount?: number;
  @ApiProperty() @IsNumber() total_amount: number;
  @ApiProperty() @IsDateString() due_date: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ type: [InvoiceItemDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => InvoiceItemDto) items?: InvoiceItemDto[];
}
