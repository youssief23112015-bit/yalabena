import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Guest payload for POST /public/placement-bookings/instant (Path A —
 * "Take Instant Online Test Now"). No account/password: the returned
 * testId is the capability token for the whole session.
 */
export class InstantPlacementBookingDto {
  @ApiProperty({ example: 'Omar Saad' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '01011112222' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ example: 'omar@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Preferred branch' })
  @IsOptional()
  @IsUUID()
  branch_id?: string;
}
