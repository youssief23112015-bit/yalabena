import { IsString, IsUUID, IsOptional, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
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
}