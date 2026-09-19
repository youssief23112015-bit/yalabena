import { IsString, IsNotEmpty, IsInt, IsOptional, IsNumber, Min, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { StockMoveType } from '../../../common/enums/stock-move-type.enum';

export class AdjustStockDto {
  @IsEnum(StockMoveType)
  type: StockMoveType;

  @IsInt() @Min(1)
  quantity: number;

  @IsString() @IsNotEmpty() @MaxLength(255)
  reason: string;

  @IsOptional() @IsNumber() @Min(0)
  unit_cost?: number;

  @IsOptional() @IsUUID()
  reference_id?: string; // e.g. purchase order / invoice

  @IsOptional() @IsString() @MaxLength(50)
  reference_type?: string;
}
