import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Fields an employee may update on their own profile.
 * Compensation (salary, hourly_rate, bank_*, currency), employee_number,
 * user_id, id, status, and termination_* are NOT updatable here.
 */
export class UpdateMyProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100)
  job_title?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  department?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  phone?: string;
}
