import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EasyKashCheckoutDto {
  @ApiProperty({ example: '3be61d69-a46b-446f-a3ad-1223a4861e99' })
  @IsUUID()
  invoice_id: string;
}