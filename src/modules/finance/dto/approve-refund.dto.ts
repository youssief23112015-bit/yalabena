import { IsIn, IsOptional, IsString } from 'class-validator';

export class ApproveRefundDto {
  @IsIn(['approve', 'reject']) action: 'approve' | 'reject';
  @IsOptional() @IsString() note?: string;
}
