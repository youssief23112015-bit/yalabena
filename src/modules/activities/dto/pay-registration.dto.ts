import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class PayRegistrationDto {
  @ApiPropertyOptional({
    example: 150,
    description: 'Amount collected; defaults to the outstanding activity fee.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;
}
