import { IsString, IsUUID, IsOptional, IsIn } from 'class-validator';

export class CreateResourceDto {
  @IsUUID()
  lesson_id: string;

  @IsString()
  title: string;

  @IsIn(['file', 'video', 'audio', 'link', 'pdf'])
  type: 'file' | 'video' | 'audio' | 'link' | 'pdf';

  @IsOptional()
  @IsString()
  file_url?: string;
}
