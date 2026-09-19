import { IsUUID, IsEnum, IsDateString, IsInt, Min, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '../../../common/enums/leave-type.enum';

export class RequestLeaveDto {
  @ApiProperty()
  @IsUUID()
  employee_id: string;

  @ApiProperty({ enum: LeaveType })
  @IsEnum(LeaveType)
  type: LeaveType;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  start_date: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  end_date: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  days_count: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachment_url?: string;
}