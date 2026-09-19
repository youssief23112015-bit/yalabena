import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsJSON } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromoType } from '../../../common/enums/promo-type.enum';

export class CreatePromoCodeDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty({ enum: PromoType }) @IsEnum(PromoType) type: PromoType;
  @ApiProperty() @IsNumber() value: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() max_discount?: number;
  @ApiProperty() @IsDateString() expiry_date: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() usage_limit?: number;
  @ApiPropertyOptional() @IsOptional() applicable_courses?: any;
  @ApiPropertyOptional() @IsOptional() applicable_branches?: any;
}
