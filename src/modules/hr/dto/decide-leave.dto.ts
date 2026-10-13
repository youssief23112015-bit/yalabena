import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DecideLeaveDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  note?: string;
}
