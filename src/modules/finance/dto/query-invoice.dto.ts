import { IsOptional, IsString, IsUUID, IsDateString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInvoiceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() student_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() due_from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() due_to?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() offset?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() limit?: number;
}
