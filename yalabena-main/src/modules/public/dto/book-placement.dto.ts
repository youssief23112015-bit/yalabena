import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEmail,
  IsUUID,
} from 'class-validator';

/**
 * Public placement-test self-booking (SRS 3.1).
 * A lead is found-or-created from the contact info, then booked into the slot.
 */
export class BookPlacementDto {
  @IsUUID()
  slot_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  last_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  level_interest?: string;
}
