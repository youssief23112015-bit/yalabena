import { IsString, IsOptional } from 'class-validator';

export class CancelSessionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
