import {
  IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID, IsNumber, Min, IsEnum, IsInt, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { InventoryCategory } from '../../../common/enums/inventory-category.enum';

/** Create an item in the master catalog. Stock lives per branch in stock_levels. */
export class SaveItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Unique item code / SKU' })
  @IsOptional() @IsString() @MaxLength(50) @Matches(/^\S+$/, { message: 'sku must not contain spaces' })
  sku?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: InventoryCategory }) @IsEnum(InventoryCategory)
  category: InventoryCategory;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  unit_cost?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  sale_price?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  unit_of_measure?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  reorder_level?: number;

  @ApiPropertyOptional({ description: 'Branch that receives initial_quantity (required when initial_quantity > 0)' })
  @IsOptional() @IsUUID()
  branch_id?: string;

  @ApiPropertyOptional({ description: 'Opening stock, recorded as an IN move' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  initial_quantity?: number;
}
