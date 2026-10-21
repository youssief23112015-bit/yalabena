import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEmail, IsUUID } from 'class-validator';

/**
 * Payload accepted by POST /public/leads from the anonymous website.
 * Everything is optional except the visitor's name and phone; the source
 * is always forced to `website` server-side (SRS 4.14).
 */
export class PublicLeadDto {
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

  @IsOptional()
  @IsString()
  @MaxLength(10)
  level_interest?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
