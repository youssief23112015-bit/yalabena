import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

/** Server-side page-view tracking (SRS 4.14 — no external analytics). */
export class TrackPageViewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  page_path: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  session_id?: string;
}
