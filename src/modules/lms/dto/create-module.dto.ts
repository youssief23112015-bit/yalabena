import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ example: 'Module 1: Basic Grammar', description: 'Title of the module' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Introduction to tenses', description: 'Description of the module', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '3c2ecfa2-aced-460f-9ee4-fa1af3d7161b', description: 'Group ID' })
  @IsString()
  @IsNotEmpty()
  group_id: string;

  @ApiProperty({ example: 1, description: 'Order index' })
  @IsNumber()
  @IsNotEmpty()
  order_index: number;
}