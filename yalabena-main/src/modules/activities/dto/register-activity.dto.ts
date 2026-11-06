import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class RegisterActivityDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Student to register. Omit when a student registers themself (resolved from the JWT).',
  })
  @IsOptional()
  @IsUUID()
  student_id?: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Mark the optional activity fee as paid immediately (books a Finance ledger transaction).',
  })
  @IsOptional()
  @IsBoolean()
  mark_paid?: boolean;
}
