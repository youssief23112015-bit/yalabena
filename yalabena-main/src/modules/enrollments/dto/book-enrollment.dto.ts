import { IsOptional, IsUUID } from 'class-validator';

/**
 * Student self-service booking payload ("Book this Course").
 * The server resolves the student from the JWT — students can never book
 * on behalf of someone else.
 */
export class BookEnrollmentDto {
  @IsUUID() course_id: string;

  /** Optional: pin a specific group of the course. Auto-selected otherwise. */
  @IsOptional() @IsUUID() group_id?: string;
}
