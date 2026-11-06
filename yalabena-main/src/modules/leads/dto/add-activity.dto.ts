import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class AddActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  scheduled_at?: string;
}
