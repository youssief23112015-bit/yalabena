import { IsString, IsUUID, IsOptional, IsInt, IsEnum } from 'class-validator';
import { ReleaseMode } from '../../../common/enums/release-mode.enum';

export class CreateQuizDto {
  @IsUUID()
  group_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  time_limit_minutes?: number;

  @IsOptional()
  @IsInt()
  passing_score?: number;

  @IsOptional()
  @IsInt()
  max_attempts?: number;

  @IsOptional()
  @IsEnum(ReleaseMode)
  release_mode?: ReleaseMode;
}
