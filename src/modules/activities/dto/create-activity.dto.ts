import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ActivityEventType } from '../../../common/enums/activity-event-type.enum';
import { ActivityStatus } from '../../../common/enums/activity-status.enum';

export class CreateActivityDto {
  @ApiProperty({ example: 'October Movie Night', description: 'Activity title (SRS 4.11)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Fun movie night with popcorn and discussion.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: ActivityEventType, example: ActivityEventType.MOVIE_NIGHT })
  @IsEnum(ActivityEventType)
  type: ActivityEventType;

  @ApiProperty({ example: '2026-10-15', description: 'Scheduled date (timestamp/date)' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'start_time must be in HH:MM format' })
  start_time?: string;

  @ApiPropertyOptional({ example: '20:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'end_time must be in HH:MM format' })
  end_time?: string;

  @ApiPropertyOptional({ example: 'Main Hall' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  branch_id: string;

  @ApiProperty({ example: 30, description: 'Capacity limit' })
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity: number;

  @ApiPropertyOptional({ example: 150, description: 'Optional fee (integrated with Finance)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({
    example: ['A1', 'B1'],
    description: 'Target student levels; empty/null means no level restriction',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  target_levels?: string[];

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Target group ids; empty/null means no group restriction',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  target_groups?: string[];

  @ApiPropertyOptional({ example: false, description: 'Open to every student regardless of targeting' })
  @IsOptional()
  @IsBoolean()
  is_open_to_all?: boolean;

  @ApiPropertyOptional({ enum: ActivityStatus, default: ActivityStatus.UPCOMING })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;
}
