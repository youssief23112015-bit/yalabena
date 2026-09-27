import { IsString, IsUUID, IsInt } from 'class-validator';

export class CreateGradebookCategoryDto {
  @IsUUID()
  group_id: string;

  @IsString()
  name: string;

  @IsInt()
  weight: number;
}
