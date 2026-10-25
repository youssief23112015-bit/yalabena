import { IsUUID, IsNumber, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ItemCondition } from '../../../common/enums/item-condition.enum';

export class IssueItemDto {
  @ApiProperty() @IsUUID()
  item_id: string;

  @ApiProperty() @IsUUID()
  student_id: string;

  @ApiProperty() @IsUUID()
  branch_id: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Optional charge to the student (defaults to the item sale price)' })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  cost?: number;
}

export class ReturnItemDto {
  @ApiPropertyOptional({ enum: ItemCondition, default: ItemCondition.GOOD })
  @IsOptional() @IsEnum(ItemCondition)
  condition?: ItemCondition;
}
