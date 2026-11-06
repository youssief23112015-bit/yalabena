import { IsUUID, IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { CheckInMethod } from '../../../common/enums/check-in-method.enum';

export class CheckInDto {
  @IsUUID()
  session_id: string;

  /** Code from the QR card (HMAC-signed, generated per session per day). */
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  code: string;

  @IsOptional()
  @IsEnum(CheckInMethod)
  method?: CheckInMethod;
}
