import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/**
 * Direct manual enrollment (Business Rule 2): place an existing active
 * student straight into a study group as an ACTIVE enrollment.
 * `course_id` is an optional consistency guard (must match the group's
 * course when provided); `force` bypasses the capacity check only.
 */
export class AddStudentDto {
  @IsUUID()
  student_id: string;

  @IsOptional() @IsUUID()
  course_id?: string;

  /** Admin bypass: enroll even when the group is at full capacity. */
  @IsOptional() @IsBoolean()
  force?: boolean;
}
