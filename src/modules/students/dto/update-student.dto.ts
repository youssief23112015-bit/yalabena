import { IsOptional, IsString, MaxLength, IsUUID, IsDateString, IsEnum } from 'class-validator';
import { StudentStatus } from '../../../common/enums/student-status.enum';

export class UpdateStudentDto {
  @IsOptional() @IsString() @MaxLength(10) current_level?: string;
  @IsOptional() @IsUUID() branch_id?: string;
  @IsOptional() @IsEnum(StudentStatus) status?: StudentStatus;
  @IsOptional() @IsDateString() enrollment_date?: string;

  // profile fields (SRS 4.1 student profile)
  @IsOptional() @IsString() @MaxLength(500) photo_url?: string;
  @IsOptional() @IsDateString() date_of_birth?: string;
  @IsOptional() @IsString() @MaxLength(10) gender?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() @MaxLength(50) national_id?: string;
  @IsOptional() @IsString() @MaxLength(100) education_level?: string;
  @IsOptional() @IsString() @MaxLength(150) emergency_contact_name?: string;
  @IsOptional() @IsString() @MaxLength(20) emergency_contact_phone?: string;
  @IsOptional() @IsString() @MaxLength(50) emergency_contact_relation?: string;
  @IsOptional() @IsString() notes?: string;
}
