import { IsUUID, IsOptional, IsString } from 'class-validator';

export class BookTestDto {
  @IsUUID()
  slot_id: string;

  /** Either a lead or an existing student must be provided. */
  @IsOptional()
  @IsUUID()
  lead_id?: string;

  @IsOptional()
  @IsUUID()
  student_id?: string;

  @IsOptional()
  @IsUUID()
  examiner_id?: string; // optional override for admin booking
}
