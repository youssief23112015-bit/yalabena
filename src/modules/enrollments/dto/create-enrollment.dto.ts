import { IsUUID, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '../../../common/enums/enrollment-status.enum';

export class CreateEnrollmentDto {
  @ApiProperty() @IsUUID() student_id: string;
  @ApiProperty() @IsUUID() group_id: string;
  @ApiPropertyOptional({ enum: EnrollmentStatus }) @IsOptional() @IsEnum(EnrollmentStatus) status?: EnrollmentStatus;
  @ApiProperty() @IsNumber() total_fee: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() promo_code_id?: string;
}
