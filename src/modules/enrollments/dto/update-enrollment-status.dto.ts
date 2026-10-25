import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateEnrollmentStatusDto {
  @IsIn(['PENDING', 'ACTIVE', 'COMPLETED', 'DROPPED'])
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'DROPPED';

  @IsOptional() @IsString() reason?: string;
}
