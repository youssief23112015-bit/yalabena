import { IsObject, IsInt } from 'class-validator';

export class SubmitAttemptDto {
  @IsObject()
  answers: Record<string, unknown>;

  @IsInt()
  time_spent_seconds: number;
}
