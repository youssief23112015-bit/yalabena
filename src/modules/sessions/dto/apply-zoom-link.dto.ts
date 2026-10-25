import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ApplyZoomLinkDto {
  @IsOptional()
  @IsString()
  zoom_join_url?: string;

  @IsOptional()
  @IsString()
  zoom_meeting_id?: string;

  @IsOptional()
  @IsString()
  zoom_start_url?: string;

  @IsOptional()
  @IsString()
  zoom_passcode?: string;

  @IsOptional()
  @IsBoolean()
  apply_to_all_group_sessions?: boolean;
}