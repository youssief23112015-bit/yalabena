import { IsUUID, IsEnum, IsDateString, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '../../../common/enums/leave-type.enum';

export class RequestLeaveDto {
  @ApiPropertyOptional({ description: 'HR / admin only. Everyone else always requests for themselves.' })
  @IsOptional() @IsUUID()
  employee_id?: string;

  @ApiProperty({ enum: LeaveType }) @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ format: 'date' }) @IsDateString()
  start_date: string;

  @ApiProperty({ format: 'date' }) @IsDateString()
  end_date: string;

  // days_count is computed server-side (inclusive calendar days); any client value is ignored.

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  reason?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  attachment_url?: string;
}
