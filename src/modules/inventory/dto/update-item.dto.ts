import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber, Min, IsEnum, IsInt, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InventoryCategory } from '../../../common/enums/inventory-category.enum';
import { InventoryStatus } from '../../../common/enums/inventory-status.enum';

/** Catalog fields only. Quantities can never be edited here - use stock movements. */
export class UpdateItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(200)
  name?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) @Matches(/^\S+$/, { message: 'sku must not contain spaces' })
  sku?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: InventoryCategory }) @IsOptional() @IsEnum(InventoryCategory)
  category?: InventoryCategory;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  unit_cost?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  sale_price?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  unit_of_measure?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  reorder_level?: number;

  @ApiPropertyOptional({ enum: InventoryStatus, description: 'Deactivate with discontinued / archived' })
  @IsOptional() @IsEnum(InventoryStatus)
  status?: InventoryStatus;
}
