import { IsUUID, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGradebookEntryDto {
  @IsUUID()
  student_id: string;

  @IsUUID()
  category_id: string;

  @IsNumber()
  score: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
