import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/**
 * Direct teacher assignment (Business Rule 1): admins may
 * replace a group's instructor at any time. Schedule/room conflicts are
 * detected server-side and returned as 409 unless `force` is set.
 */
export class AssignTeacherDto {
  @IsUUID()
  teacher_id: string;

  /** Admin bypass: assign even when conflicts were detected. */
  @IsOptional() @IsBoolean()
  force?: boolean;
}
