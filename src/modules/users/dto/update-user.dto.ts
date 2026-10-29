import { IsEmail, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Payload accepted by PUT /users/:id — mirrors the frontend edit form. */
export class UpdateUserDto {
  @ApiProperty({ required: false, example: 'Ahmed' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  first_name?: string;

  @ApiProperty({ required: false, example: 'Ali' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  last_name?: string;

  @ApiProperty({ required: false, example: 'ahmed@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: '01012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  role_id?: string;

  @ApiProperty({ required: false, example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;
}

/** Payload accepted by POST /users/:id/reset-password. */
export class ResetPasswordDto {
  @ApiProperty({ example: 'newSecret123' })
  @IsString()
  @Length(6, 100)
  @Matches(/^.{6,}$/, { message: 'password must be at least 6 characters' })
  password: string;
}

/** Payload accepted by PATCH /users/:id/status. */
export class UpdateUserStatusDto {
  @ApiProperty({ example: 'active' })
  @IsString()
  @Length(1, 20)
  status: string;
}
