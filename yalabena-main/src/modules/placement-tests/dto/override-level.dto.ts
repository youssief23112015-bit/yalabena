import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class OverrideLevelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  final_level: string;

  @IsString()
  @IsNotEmpty()
  override_reason: string;
}
