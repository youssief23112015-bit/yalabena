import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { RegistrationStatus } from '../../../common/enums/registration-status.enum';

/** Attendance can only move a registration between these states. */
export const ATTENDANCE_STATUSES = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.ATTENDED,
  RegistrationStatus.NO_SHOW,
] as const;

export class AttendanceRecordDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  student_id: string;

  @ApiProperty({ enum: ATTENDANCE_STATUSES })
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;
}

export class MarkAttendanceDto {
  @ApiPropertyOptional({
    type: [AttendanceRecordDto],
    description: 'Bulk attendance records; takes precedence when provided.',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records?: AttendanceRecordDto[];

  @ApiPropertyOptional({ format: 'uuid', description: 'Single-record shorthand' })
  @IsOptional()
  @IsUUID()
  student_id?: string;

  @ApiPropertyOptional({ enum: ATTENDANCE_STATUSES, description: 'Single-record shorthand' })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
