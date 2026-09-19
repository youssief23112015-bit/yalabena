import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 'Lesson 1: Present Simple' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Detailed content here...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'MODULE_UUID_HERE' })
  @IsString()
  @IsNotEmpty()
  module_id: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  order_index: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_published?: boolean;
}