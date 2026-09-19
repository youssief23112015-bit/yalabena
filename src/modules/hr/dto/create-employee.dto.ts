
import { IsString, IsUUID, IsEnum, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeType } from '../../../common/enums/employee-type.enum';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'UUID of the associated user account' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ enum: EmployeeType })
  @IsEnum(EmployeeType)
  employee_type: EmployeeType;

  @ApiProperty()
  @IsString()
  job_title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  contract_start: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  contract_end?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  hourly_rate?: number;
}