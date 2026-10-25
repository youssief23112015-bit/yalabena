import { IsString, IsNotEmpty, IsInt, IsOptional, IsNumber, Min, IsUUID, MaxLength, NotEquals } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/** POST /inventory/:id/adjust - manual correction (stock count, damage, etc.). */
export class AdjustStockDto {
  @ApiProperty() @IsUUID()
  branch_id: string;

  @ApiProperty({ description: 'Signed change: +5 adds five units, -3 removes three. Must not be 0.' })
  @Type(() => Number) @IsInt() @NotEquals(0)
  quantity: number;

  @ApiProperty({ description: 'Mandatory reason (SRS 4.12)' })
  @IsString() @IsNotEmpty() @MaxLength(255)
  reason: string;
}

/** POST /inventory/:id/receive - goods in (purchase, donation, supplier delivery). */
export class ReceiveStockDto {
  @ApiProperty() @IsUUID()
  branch_id: string;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Cost per unit for this delivery' })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  unit_cost?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ description: 'Supplier invoice / PO reference' })
  @IsOptional() @IsUUID()
  reference_id?: string;
}

/** POST /inventory/:id/transfer - move stock between branches atomically. */
export class TransferStockDto {
  @ApiProperty() @IsUUID()
  from_branch_id: string;

  @ApiProperty() @IsUUID()
  to_branch_id: string;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(1)
  quantity: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  reason?: string;
}
