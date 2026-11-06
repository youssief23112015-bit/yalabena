import { IsString, IsNotEmpty, MaxLength, IsOptional, Matches } from 'class-validator';

export class AddTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'color must be a hex value like #FF0000' })
  color?: string;
}
