import { IsOptional, IsString, IsUUID, IsInt, Min, Max, IsIn, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { InventoryCategory } from '../../../common/enums/inventory-category.enum';
import { InventoryStatus } from '../../../common/enums/inventory-status.enum';
import { StockMoveType } from '../../../common/enums/stock-move-type.enum';

const toBool = ({ value }: { value: unknown }) => value === true || value === 'true' || value === '1';

export class ListItemsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() branch_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: InventoryCategory }) @IsOptional() @IsEnum(InventoryCategory) category?: InventoryCategory;
  @ApiPropertyOptional({ enum: InventoryStatus }) @IsOptional() @IsEnum(InventoryStatus) status?: InventoryStatus;
  @ApiPropertyOptional() @IsOptional() @Transform(toBool) @IsBoolean() low_stock_only?: boolean;
  @ApiPropertyOptional({ enum: ['name', 'sku', 'quantity', 'unit_cost', 'created_at'] })
  @IsOptional() @IsIn(['name', 'sku', 'quantity', 'unit_cost', 'created_at'])
  sort?: 'name' | 'sku' | 'quantity' | 'unit_cost' | 'created_at';
  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] }) @IsOptional() @IsIn(['ASC', 'DESC']) order?: 'ASC' | 'DESC';
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number;
}

export class ListMovesQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() item_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branch_id?: string;
  @ApiPropertyOptional({ enum: StockMoveType }) @IsOptional() @IsEnum(StockMoveType) type?: StockMoveType;
  @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional({ description: 'YYYY-MM-DD (inclusive)' }) @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number;
}

export class ListIssuesQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() student_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branch_id?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(toBool) @IsBoolean() open_only?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number;
}

export class BranchQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() branch_id?: string;
}

export class MovementReportQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() branch_id?: string;
  @ApiPropertyOptional({ description: 'YYYY-MM-DD' }) @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional({ description: 'YYYY-MM-DD (inclusive)' }) @IsOptional() @IsDateString() to?: string;
}
