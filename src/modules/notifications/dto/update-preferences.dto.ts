import { IsArray, IsBoolean, IsEnum, IsString, MaxLength, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannel } from '../../../common/enums/notification-channel.enum';

export class NotificationPreferenceItemDto {
  @ApiProperty({ enum: NotificationChannel, example: 'email' })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({ example: 'finance' })
  @IsString()
  @MaxLength(50)
  module: string;

  @ApiProperty({ example: 'payment_received' })
  @IsString()
  @MaxLength(50)
  event: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_enabled: boolean;
}

export class UpdatePreferencesDto {
  @ApiProperty({ type: [NotificationPreferenceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceItemDto)
  preferences: NotificationPreferenceItemDto[];
}
