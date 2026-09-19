import { IsUUID, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePayrollEntryDto {
  @ApiProperty()
  @IsUUID()
  payroll_period_id: string;

  @ApiProperty()
  @IsUUID()
  employee_id: string;

  @ApiProperty()
  @IsNumber()
  base_amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hours_worked?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  classes_taught?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bonus?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deductions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}