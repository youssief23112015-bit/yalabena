import { IsString, IsUUID, IsEnum, IsOptional, IsDateString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../../common/enums/document-type.enum';

export class AddDocumentDto {
  @ApiProperty() @IsUUID()
  employee_id: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'URL returned by POST /files/upload?kind=hr' })
  @IsString() @IsNotEmpty() @MaxLength(500)
  file_url: string;

  @ApiProperty({ enum: DocumentType }) @IsEnum(DocumentType)
  document_type: DocumentType;

  @ApiPropertyOptional({ format: 'date' }) @IsOptional() @IsDateString()
  expiry_date?: string;
}
