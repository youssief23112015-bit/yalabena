import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class ChangeLevelDto {
  @IsString() @IsNotEmpty() @MaxLength(10)
  new_level: string;

  @IsString() @IsNotEmpty() @MaxLength(50)
  reason: string;

  @IsOptional() @IsUUID()
  reference_id?: string; // e.g. placement test id
}
