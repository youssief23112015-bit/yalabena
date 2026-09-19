import { IsString, IsOptional, IsUUID, IsEnum, IsEmail, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../common/enums/user-status.enum';

export class CreateBranchDto {
  @ApiProperty({ example: 'Cairo Main Branch' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Nile St, Cairo' })
  @IsString()
  address: string;

  @ApiProperty({ example: '+201234567890' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'cairo@speakup.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'UUID of the branch manager user' })
  @IsOptional()
  @IsUUID()
  manager_id?: string;

  @ApiPropertyOptional({ example: 5, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  classroom_count?: number;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiPropertyOptional({ enum: UserStatus, default: 'active' })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}