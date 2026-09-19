import { IsOptional, IsUUID, IsInt, Min, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class StudentQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number = 20;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsUUID() branch_id?: string;
  @IsOptional() @IsString() @MaxLength(10) level?: string;
  @IsOptional() @IsString() @MaxLength(20) status?: string;
}
