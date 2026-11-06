import { IsString, IsOptional, IsNotEmpty, MaxLength, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../../common/enums/document-type.enum';

export class AddMyDocumentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(500)
  file_url?: string;

  @ApiPropertyOptional({ enum: DocumentType }) @IsOptional() @IsEnum(DocumentType)
  document_type?: DocumentType;

  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString()
  expiry_date?: string;
}
