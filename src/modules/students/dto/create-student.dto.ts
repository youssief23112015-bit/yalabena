import { IsString, IsNotEmpty, IsEmail, MaxLength, IsOptional, IsUUID, IsDateString } from 'class-validator';

export class CreateStudentDto {
  @IsString() @IsNotEmpty() @MaxLength(100) first_name: string;
  @IsString() @IsNotEmpty() @MaxLength(100) last_name: string;
  @IsEmail() @MaxLength(255) email: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsUUID() branch_id?: string;
  @IsOptional() @IsString() @MaxLength(10) level?: string;
  @IsOptional() @IsDateString() enrollment_date?: string;
}
