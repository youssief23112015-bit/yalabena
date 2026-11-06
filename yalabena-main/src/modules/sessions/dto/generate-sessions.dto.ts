import { IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSessionsDto {
  @ApiProperty({ description: 'UUID of the group to generate sessions for' })
  @IsUUID()
  group_id: string;

  @ApiProperty({ format: 'date', example: '2026-09-01' })
  @IsDateString()
  from: string;

  @ApiProperty({ format: 'date', example: '2026-09-30' })
  @IsDateString()
  to: string;
}