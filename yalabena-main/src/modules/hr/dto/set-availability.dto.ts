import { IsUUID, IsInt, Min, Max, IsString, IsBoolean, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class SetAvailabilityDto {
  @ApiPropertyOptional({ description: 'HR / admin only. Teachers always edit their own slots.' })
  @IsOptional() @IsUUID()
  employee_id?: string;

  @ApiProperty({ description: '0 = Sunday, 1 = Monday, ..., 6 = Saturday' })
  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  day_of_week: number;

  @ApiProperty({ example: '09:00' }) @IsString() @Matches(TIME, { message: 'start_time must be HH:mm' })
  start_time: string;

  @ApiProperty({ example: '17:00' }) @IsString() @Matches(TIME, { message: 'end_time must be HH:mm' })
  end_time: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  is_available?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  note?: string;
}

export class UpdateAvailabilityDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(6)
  day_of_week?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(TIME, { message: 'start_time must be HH:mm' })
  start_time?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(TIME, { message: 'end_time must be HH:mm' })
  end_time?: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  is_available?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  note?: string;
}
