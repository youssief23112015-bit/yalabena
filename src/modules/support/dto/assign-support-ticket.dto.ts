import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class AssignSupportTicketDto {
  @IsUUID()
  @IsNotEmpty()
  assigned_to: string;
}
