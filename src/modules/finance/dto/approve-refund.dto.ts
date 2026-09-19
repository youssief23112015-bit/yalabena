import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveRefundDto {
  @ApiPropertyOptional() @IsOptional() @IsString() approval_note?: string;
}
