import { IsString, IsUUID, IsOptional } from 'class-validator';

export class SubmitAssignmentDto {
  @IsUUID()
  assignment_id: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsString()
  file_name?: string;
}
