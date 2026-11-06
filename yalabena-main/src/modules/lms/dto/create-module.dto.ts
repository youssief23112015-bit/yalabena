import { IsString, IsUUID, IsInt, IsOptional } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  group_id: string;

  @IsInt()
  order_index: number;
}
