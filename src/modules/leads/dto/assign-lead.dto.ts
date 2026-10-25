import { IsUUID, IsOptional } from 'class-validator';

export class AssignLeadDto {
  /** Omit to auto-assign to the least-loaded sales agent (round-robin). */
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsUUID()
  branch_id?: string;
}
