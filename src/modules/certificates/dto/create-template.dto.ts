import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTemplateDto {
  @IsString() name: string;
  @IsOptional() @IsUUID() course_id?: string;
  @IsString() html_template: string;
  @IsOptional() placeholders?: Record<string, any>;
  @IsOptional() @IsString() background_url?: string;
  @IsOptional() @IsBoolean() is_default?: boolean;
}
