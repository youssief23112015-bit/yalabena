import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class MyPayrollQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString()
  period_id?: string;
}
