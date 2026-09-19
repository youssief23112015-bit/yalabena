import { IsUUID, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IssueItemDto {
  @ApiProperty()
  @IsUUID()
  item_id: string;

  @ApiProperty()
  @IsUUID()
  student_id: string;

  @ApiProperty()
  @IsUUID()
  branch_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional({ description: 'Optional reference ID (e.g., enrollment_id)' })
  @IsOptional()
  @IsString()
  reference_id?: string; // ✅ FIXED: Added reference_id
}