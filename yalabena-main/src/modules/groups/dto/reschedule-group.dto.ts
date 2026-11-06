import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** One weekly window of a recurring schedule (weekday 0 = Sunday … 6 = Saturday). */
export class ScheduleWindowDto {
  @ApiProperty({ description: 'Weekday: 0 = Sunday … 6 = Saturday', example: 0, minimum: 0, maximum: 6 })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @ApiProperty({ description: 'Academy wall-clock start (HH:MM)', example: '18:00' })
  @IsString()
  @Matches(/^\d{1,2}:\d{2}(:\d{2})?$/, { message: 'start_time must be HH:MM or HH:MM:SS' })
  start_time: string;

  @ApiProperty({ description: 'Academy wall-clock end (HH:MM), same day', example: '19:30' })
  @IsString()
  @Matches(/^\d{1,2}:\d{2}(:\d{2})?$/, { message: 'end_time must be HH:MM or HH:MM:SS' })
  end_time: string;

  @ApiPropertyOptional({ description: 'Classroom/room UUID for this window' })
  @IsOptional()
  @IsUUID()
  classroom_id?: string;
}

export class RescheduleGroupDto {
  @ApiProperty({
    description: 'First date (YYYY-MM-DD) the NEW schedule applies to. Sessions before this date are preserved.',
    example: '2026-11-08',
  })
  @IsDateString()
  effective_date: string;

  @ApiProperty({ type: [ScheduleWindowDto], description: 'The new weekly windows (replaces existing ones)' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScheduleWindowDto)
  windows: ScheduleWindowDto[];
}
