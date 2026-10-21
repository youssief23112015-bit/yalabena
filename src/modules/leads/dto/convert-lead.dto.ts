import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConvertLeadDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  level?: string;
}
