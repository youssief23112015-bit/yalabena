import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEmail, IsUUID } from 'class-validator';

/** Payload accepted by POST /public/registrations (anonymous online registration). */
export class PublicRegistrationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  last_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsUUID()
  course_id: string;

  @IsUUID()
  branch_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  level_interest?: string;
}
