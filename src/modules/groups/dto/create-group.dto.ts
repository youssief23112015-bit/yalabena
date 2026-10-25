import { IsString, IsUUID, IsOptional, IsInt, Min, IsEnum, IsDateString, IsUrl, MaxLength } from 'class-validator';
import { GroupMode } from '../../../common/enums/group-mode.enum';
import { GroupStatus } from '../../../common/enums/group-status.enum';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  branchId: string;

  @IsUUID()
  teacherId: string;

  @IsUUID()
  @IsOptional()
  substitute_teacher_id?: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsEnum(GroupMode)
  @IsOptional()
  mode?: GroupMode;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsEnum(GroupStatus)
  @IsOptional()
  status?: GroupStatus;

  /** The group's ONE fixed meeting URL, shared by all its sessions. */
  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }, { message: 'zoom_link must be a valid http(s) URL' })
  @MaxLength(500)
  zoom_link?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] }, { message: 'onmeet_link must be a valid http(s) URL' })
  @MaxLength(500)
  onmeet_link?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  zoom_meeting_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  onmeet_meeting_id?: string;
}