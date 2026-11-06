import { IsString, IsUUID, IsInt, IsOptional, IsBoolean, IsArray, IsDateString } from 'class-validator';

export class CreateAssignmentDto {
  @IsUUID()
  group_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsInt()
  max_score: number;

  @IsOptional()
  @IsDateString()
  due_at?: string;

  @IsOptional()
  @IsBoolean()
  allow_late?: boolean;

  @IsOptional()
  @IsString()
  category_tag?: string;

  @IsOptional()
  @IsArray()
  reference_files?: string[];
}
