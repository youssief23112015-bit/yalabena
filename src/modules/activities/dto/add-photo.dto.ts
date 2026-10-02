import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AddPhotoDto {
  @ApiProperty({
    example: 'https://storage.example.com/uploads/activity-1.jpg',
    description: 'Uploaded via POST /files/upload?kind=activity first',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  file_url: string;

  @ApiPropertyOptional({ example: 'Students enjoying the conversation club' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  caption?: string;
}
