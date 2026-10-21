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
 * Payload for the "Send Broadcast" modal (SRS 4.18), extended with explicit
 * targeting (Business Rules 1–2):
 *  - Admin: any target_type.
 *  - Teacher: ONLY `group` — and only for groups they are assigned to.
 */
export type BroadcastTargetType =
  | 'all'
  | 'students'
  | 'teachers'
  | 'specific_user'
  | 'group';

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
    enum: ['all', 'students', 'teachers', 'specific_user', 'group'],
    default: 'all',
    description:
      'Audience selector — everyone, a whole role, one user, or a study group. ' +
      'Teachers may only use "group".',
  })
  @IsOptional()
  @IsIn(['all', 'students', 'teachers', 'specific_user', 'group'])
  target_type?: BroadcastTargetType;

  /** Required exactly when target_type === 'specific_user'. */
  @ApiPropertyOptional({ format: 'uuid', description: 'Recipient (target_type = specific_user)' })
  @ValidateIf((o: SendBroadcastDto) => o.target_type === 'specific_user')
  @IsUUID()
  target_user_id?: string;

  /** Required exactly when target_type === 'group'. */
  @ApiPropertyOptional({ format: 'uuid', description: 'Study group (target_type = group)' })
  @ValidateIf((o: SendBroadcastDto) => o.target_type === 'group')
  @IsUUID()
  group_id?: string;

  /**
   * @deprecated legacy audience selector kept for older clients — the
   * service translates it into target_type ('student' → 'students', …).
   */
  @ApiPropertyOptional({
    enum: ['all', 'student', 'teacher', 'hr'],
    description: 'Legacy audience filter — prefer target_type',
  })
  @IsOptional()
  @IsIn(['all', 'student', 'teacher', 'hr'])
  target_role?: 'all' | 'student' | 'teacher' | 'hr';
}
