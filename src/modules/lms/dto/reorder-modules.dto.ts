import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class ReorderModulesDto {
  @IsUUID()
  group_id: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ordered_ids: string[];
}
