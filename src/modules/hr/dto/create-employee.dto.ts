import {
  IsString, IsUUID, IsEnum, IsOptional, IsDateString, IsNumber, Min, MaxLength, IsNotEmpty, Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EmployeeType } from '../../../common/enums/employee-type.enum';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'UUID of the associated user account' })
  @IsUUID()
  user_id: string;

  @ApiProperty({ enum: EmployeeType })
  @IsEnum(EmployeeType)
  employee_type: EmployeeType;

  @ApiProperty()
  @IsString() @IsNotEmpty() @MaxLength(100)
  job_title: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  department?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(50)
  employee_number?: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  contract_start: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional() @IsDateString()
  contract_end?: string;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  salary?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({ example: 'EGP' })
  @IsOptional() @IsString() @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  bank_name?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(100)
  bank_account?: string;
}
