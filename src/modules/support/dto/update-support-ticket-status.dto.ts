import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { SupportTicketStatus } from '../../../common/enums/support-ticket-status.enum';

export class UpdateSupportTicketStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(SupportTicketStatus)
  status: SupportTicketStatus;
}
