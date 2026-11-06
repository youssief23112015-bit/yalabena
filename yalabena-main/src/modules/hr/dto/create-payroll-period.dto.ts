import { IsString, IsDateString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePayrollPeriodDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100)
  name: string;

  @ApiProperty({ format: 'date' }) @IsDateString()
  start_date: string;

  @ApiProperty({ format: 'date' }) @IsDateString()
  end_date: string;
}
