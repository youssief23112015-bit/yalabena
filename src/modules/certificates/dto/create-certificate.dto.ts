import { IsUUID, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCertificateDto {
  @ApiProperty() @IsUUID() student_id: string;
  @ApiProperty() @IsUUID() course_id: string;
  @ApiProperty() @IsUUID() group_id: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() template_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiry_date?: string;
}
