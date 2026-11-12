import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { SupportTicketPriority } from '../../../common/enums/support-ticket-priority.enum';

export class CreateSupportTicketDto {
  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(SupportTicketPriority)
  @IsOptional()
  priority?: SupportTicketPriority;
}
