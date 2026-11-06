import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@speakup.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiPropertyOptional({ example: '+201012345678' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  @MaxLength(100)
  first_name: string;

  @ApiProperty({ example: 'Farouk' })
  @IsString()
  @MaxLength(100)
  last_name: string;

  @ApiPropertyOptional({ example: 'ar' })
  @IsOptional()
  @IsIn(['ar', 'en'])
  language?: string;
}
