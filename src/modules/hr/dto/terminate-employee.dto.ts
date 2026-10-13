import { IsString, IsNotEmpty, MaxLength, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TerminateEmployeeDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString()
  termination_date?: string;
}
