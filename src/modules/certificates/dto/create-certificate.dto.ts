import { IsOptional, IsUUID } from 'class-validator';

export class CreateCertificateDto {
  @IsUUID() student_id: string;
  @IsUUID() course_id: string;
  @IsUUID() group_id: string;
  @IsOptional() @IsUUID() template_id?: string;
}
