import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EmployeeStatus } from '../../../common/enums/employee-status.enum';
import { EmployeeType } from '../../../common/enums/employee-type.enum';
import { LeaveStatus } from '../../../common/enums/leave-status.enum';

export class ListEmployeesQueryDto {
  @ApiPropertyOptional({ enum: EmployeeStatus }) @IsOptional() @IsEnum(EmployeeStatus) status?: EmployeeStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional({ enum: EmployeeType }) @IsOptional() @IsEnum(EmployeeType) type?: EmployeeType;
  @ApiPropertyOptional({ description: 'name, email, job title, department or employee number' })
  @IsOptional() @IsString() search?: string;
}

export class ListLeavesQueryDto {
  @ApiPropertyOptional({ enum: LeaveStatus }) @IsOptional() @IsEnum(LeaveStatus) status?: LeaveStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() employee_id?: string;
}
