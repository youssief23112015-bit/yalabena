import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ViolationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  room_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sender_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rule_matched?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_false_positive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}
