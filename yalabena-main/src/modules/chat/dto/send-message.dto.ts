import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatMessageType } from '../../../common/enums/chat-message-type.enum';

export class SendMessageDto {
  @ApiProperty()
  @IsUUID()
  room_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @ApiPropertyOptional({ enum: ChatMessageType, default: ChatMessageType.TEXT })
  @IsOptional()
  @IsEnum(ChatMessageType)
  type?: ChatMessageType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  file_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  file_size?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reply_to_id?: string;
}
