import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ActivityEventType } from '../../../common/enums/activity-event-type.enum';
import { ActivityStatus } from '../../../common/enums/activity-status.enum';

export class ActivityQueryDto {
  @ApiPropertyOptional({ enum: ActivityEventType })
  @IsOptional()
  @IsEnum(ActivityEventType)
  type?: ActivityEventType;

  @ApiPropertyOptional({ enum: ActivityStatus })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({ description: 'Filter by targeted student level (e.g. B1)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  level?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Branch filter (non-admins are locked to their own branch)' })
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional({ description: 'Free-text search on title/description' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
