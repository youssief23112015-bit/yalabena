import { IsArray, IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePromoCodeDto {
  @IsString() code: string;
  @IsIn(['percentage', 'fixed']) type: 'percentage' | 'fixed';
  @IsNumber() @Min(0) value: number;
  @IsOptional() @IsNumber() @Min(0) max_discount?: number;
  @IsDateString() expiry_date: string;
  @IsOptional() @IsNumber() @Min(1) usage_limit?: number;
  @IsOptional() @IsArray() applicable_courses?: string[];
  @IsOptional() @IsArray() applicable_branches?: string[];
}
