import { IsUUID, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateFollowUpDto {
  @IsUUID()
  @IsNotEmpty()
  assigned_to: string;

  @IsNotEmpty()
  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsString()
  note?: string;
}