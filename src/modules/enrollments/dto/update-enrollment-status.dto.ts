import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateEnrollmentStatusDto {
  /**
   * The PG `enrollment_status` enum holds ONLY lowercase labels
   * ('pending' | 'active' | 'completed' | 'dropped'). The admin dashboard
   * historically sent UPPERCASE ('ACTIVE') and the raw value reached
   * PostgreSQL, crashing with `invalid input value for enum
   * enrollment_status: "ACTIVE"`. Normalise at the validation boundary:
   * the global ValidationPipe runs @Transform before @IsIn, so both
   * casings (and any casing mix) are accepted and stored lowercase.
   */
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  @IsIn(['pending', 'active', 'completed', 'dropped'])
  status: 'pending' | 'active' | 'completed' | 'dropped';

  @IsOptional() @IsString() reason?: string;
}
