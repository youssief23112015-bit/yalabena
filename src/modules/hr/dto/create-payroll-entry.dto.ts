import { IsUUID, IsNumber, IsOptional, IsString, IsInt, Min, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PayrollEntryStatus } from '../../../common/enums/payroll-entry-status.enum';

/**
 * base_amount and hourly_rate are NOT accepted from the client: they are taken from the
 * employee record so the DB check chk_pe_total_formula always holds.
 */
export class CreatePayrollEntryDto {
  @ApiProperty() @IsUUID()
  payroll_period_id: string;

  @ApiProperty() @IsUUID()
  employee_id: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  hours_worked?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  classes_taught?: number;

  @ApiPropertyOptional({ description: 'Allowances / bonus' })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  bonus?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  deductions?: number;

  @ApiPropertyOptional({ enum: PayrollEntryStatus }) @IsOptional() @IsEnum(PayrollEntryStatus)
  status?: PayrollEntryStatus;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}
