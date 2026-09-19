import { IsUUID, IsDateString, IsString, Matches, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { GroupMode } from '../../../common/enums/group-mode.enum';

export class CreateSlotDto {
  @IsUUID()
  branch_id: string;

  @IsUUID()
  examiner_id: string;

  @IsDateString()
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'start_time must be HH:MM' })
  start_time: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'end_time must be HH:MM' })
  end_time: string;

  @IsOptional()
  @IsEnum(GroupMode)
  mode?: GroupMode;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}

import { Type } from 'class-transformer';
