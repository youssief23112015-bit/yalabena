import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentStatus } from '../../../common/enums/enrollment-status.enum';

export class UpdateEnrollmentStatusDto {
  @ApiProperty({ enum: EnrollmentStatus }) @IsEnum(EnrollmentStatus) status: EnrollmentStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
