import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class OralScoresDto {
  @IsInt() @Min(0) @Max(25)
  fluency: number;

  @IsInt() @Min(0) @Max(25)
  grammar: number;

  @IsInt() @Min(0) @Max(25)
  vocabulary: number;

  @IsInt() @Min(0) @Max(25)
  pronunciation: number;

  @IsOptional()
  @IsString()
  examiner_notes?: string;
}
