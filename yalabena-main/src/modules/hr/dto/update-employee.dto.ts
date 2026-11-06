import { IsString, IsEnum, IsOptional, IsDateString, IsNumber, Min, MaxLength, IsNotEmpty, Length, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EmployeeType } from '../../../common/enums/employee-type.enum';

/**
 * Whitelisted fields for PATCH /hr/employees/:id.
 * user_id, id and termination_* can never be changed here; termination has its own endpoint.
 */
export class UpdateEmployeeDto {
  @ApiPropertyOptional({ enum: EmployeeType }) @IsOptional() @IsEnum(EmployeeType)
  employee_type?: EmployeeType;

  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  job_title?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  department?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)
  employee_number?: string;

  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString()
  contract_start?: string;

  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString()
  contract_end?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  salary?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  bank_name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  bank_account?: string;

  @ApiPropertyOptional({ enum: ['active', 'on_leave', 'suspended'], description: 'Use /terminate to terminate' })
  @IsOptional() @IsIn(['active', 'on_leave', 'suspended'])
  status?: 'active' | 'on_leave' | 'suspended';
}
