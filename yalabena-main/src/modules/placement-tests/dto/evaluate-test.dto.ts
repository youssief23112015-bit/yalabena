import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Examiner evaluation payload for PATCH /placement-tests/:id/evaluate.
 * When the test is completed without an explicit final_level, the server
 * derives it from the score via the CEFR scoring matrix and syncs it to the
 * Lead + Student records.
 */
export class EvaluateTestDto {
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  written_score?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  oral_score?: number;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(10)
  final_level?: string;

  @IsOptional() @IsString()
  examiner_notes?: string;

  @IsOptional()
  @IsIn(['scheduled', 'in_progress', 'completed', 'no_show', 'cancelled'])
  status?: 'scheduled' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
}
