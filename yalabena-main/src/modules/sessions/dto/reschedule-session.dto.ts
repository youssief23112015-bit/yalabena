import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RescheduleSessionDto {
  @ApiPropertyOptional({ format: 'date', example: '2026-09-20' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ format: 'date', example: '2026-09-20' })
  @IsOptional()
  @IsDateString()
  new_date?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @IsString()
  end_time?: string;
}