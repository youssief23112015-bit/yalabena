import { IsOptional, IsUUID, IsString, MaxLength } from 'class-validator';

export class ConvertLeadDto {
  @IsOptional()
  @IsUUID()
  branch_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  level?: string;
}
