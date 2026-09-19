import { IsString, IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../../common/enums/document-type.enum';

export class AddDocumentDto {
  @ApiProperty()
  @IsUUID()
  employee_id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  file_url: string;

  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  document_type: DocumentType;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  expiry_date?: string;
}