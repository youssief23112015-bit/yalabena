import { IsString, IsNotEmpty, MaxLength, IsOptional, IsUUID, IsNumber, Min, IsEnum, IsInt } from 'class-validator';
import { InventoryCategory } from '../../../common/enums/inventory-category.enum';

export class SaveItemDto {
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @IsOptional() @IsString() @MaxLength(50) sku?: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(InventoryCategory) category: InventoryCategory;
  @IsOptional() @IsNumber() @Min(0) unit_cost?: number;
  @IsOptional() @IsNumber() @Min(0) unit_price?: number;
  @IsOptional() @IsString() @MaxLength(20) unit_of_measure?: string;
  @IsOptional() @IsInt() @Min(0) reorder_level?: number;
  @IsUUID() branch_id: string;
  @IsOptional() @IsInt() @Min(0) initial_quantity?: number; // only used on create
}
