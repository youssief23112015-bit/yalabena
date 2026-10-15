import { IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength, ArrayNotEmpty, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Admin announcement (SRS 4.18) — target explicit users or everyone with a role. */
export class BroadcastNotificationDto {
  @ApiPropertyOptional({ type: [String], description: 'Explicit recipient user UUIDs' })
  @ValidateIf((o) => !o.role_slug)
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  user_ids?: string[];

  @ApiPropertyOptional({ example: 'student', description: 'Send to all users holding this role slug' })
  @ValidateIf((o) => !o.user_ids)
  @IsString()
  @MaxLength(100)
  role_slug?: string;

  @ApiProperty({ example: 'system' })
  @IsString()
  @MaxLength(50)
  module: string;

  @ApiProperty({ example: 'announcement' })
  @IsString()
  @MaxLength(50)
  event: string;

  @ApiProperty({ example: 'Scheduled maintenance' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'The portal will be offline Sunday 02:00–04:00.' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: '/announcements/42' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  action_url?: string;
}

/**
 * Payload for the admin "Send Broadcast" modal (SRS 4.18).
 * Delivers one in-app notification to every active user, optionally
 * narrowed down to a single role audience.
 */
export class SendBroadcastDto {
  @ApiProperty({ example: 'Scheduled maintenance' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'The portal will be offline Sunday 02:00–04:00.' })
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  message: string;

  @ApiPropertyOptional({
    enum: ['all', 'student', 'teacher', 'hr'],
    default: 'all',
    description: 'Audience filter — "all" (default) or a single role slug',
  })
  @IsOptional()
  @IsIn(['all', 'student', 'teacher', 'hr'])
  target_role?: 'all' | 'student' | 'teacher' | 'hr';
}
