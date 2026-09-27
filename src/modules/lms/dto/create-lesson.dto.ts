import { IsString, IsUUID, IsInt, IsOptional } from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  module_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  order_index: number;
}
