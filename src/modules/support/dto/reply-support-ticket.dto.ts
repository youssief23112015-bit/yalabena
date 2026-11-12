import { IsString, IsNotEmpty } from 'class-validator';

export class ReplySupportTicketDto {
  @IsString()
  @IsNotEmpty()
  body: string;
}
