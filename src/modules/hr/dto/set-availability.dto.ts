import { IsUUID, IsInt, Min, Max, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SetAvailabilityDto {
  @ApiProperty()
  @IsUUID()
  employee_id: string;

  @ApiProperty({ description: '0 = Sunday, 1 = Monday, ..., 6 = Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  start_time: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  end_time: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}