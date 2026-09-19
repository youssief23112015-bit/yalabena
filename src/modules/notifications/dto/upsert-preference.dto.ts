import { IsEnum, IsString, MaxLength, IsBoolean } from 'class-validator';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';

export class UpsertPreferenceDto {
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsString()
  @MaxLength(50)
  module: string;

  @IsString()
  @MaxLength(50)
  event: string;

  @IsBoolean()
  is_enabled: boolean;
}
