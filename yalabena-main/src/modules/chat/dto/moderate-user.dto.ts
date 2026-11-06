import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModerateUserDto {
  @ApiProperty()
  @IsUUID()
  room_id: string;

  @ApiProperty()
  @IsUUID()
  user_id: string;

  @ApiProperty({ enum: ['mute', 'ban', 'unmute', 'unban', 'warn'] })
  @IsEnum(['mute', 'ban', 'unmute', 'unban', 'warn'])
  action: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Minutes for mute/ban duration' })
  @IsOptional()
  duration_minutes?: number;
}
