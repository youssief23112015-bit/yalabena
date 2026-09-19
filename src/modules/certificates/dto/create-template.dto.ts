import { IsString, IsOptional, IsUUID, IsJSON } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() course_id?: string;
  @ApiProperty() @IsString() html_template: string;
  @ApiProperty() placeholders: any;
  @ApiPropertyOptional() @IsOptional() @IsString() background_url?: string;
  @ApiPropertyOptional({ default: false }) @IsOptional() is_default?: boolean;
}
