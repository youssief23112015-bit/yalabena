import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'user@speakup.com' })
  @IsEmail({}, { message: 'email must be a valid email' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123XYZ!', description: 'Reset token from the email link' })
  @IsString()
  @IsNotEmpty({ message: 'token is required' })
  token: string;

  @ApiProperty({ example: 'abc123XYZ!', description: 'New password' })
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  password: string;
}
