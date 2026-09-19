import { IsUUID, IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RefundReason } from '../../../common/enums/refund-reason.enum';

export class CreateRefundDto {
  @ApiProperty() @IsUUID() payment_id: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty({ enum: RefundReason }) @IsEnum(RefundReason) reason_code: RefundReason;
  @ApiPropertyOptional() @IsOptional() @IsString() reason_note?: string;
}
