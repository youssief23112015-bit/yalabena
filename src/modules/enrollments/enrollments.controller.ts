import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';

@ApiTags('Enrollments')
@ApiBearerAuth('JWT')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Post()
  @Roles('super_admin', 'branch_manager', 'sales', 'finance')
  @ApiOperation({ summary: 'Create enrollment' })
  @ApiResponse({ status: 201, description: 'Enrollment created successfully.' })
  create(@Body() dto: CreateEnrollmentDto, @CurrentUser() user: any) {
    return this.service.create(dto, user.userId, user.branchId);
  }

  @Get()
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic')
  @ApiOperation({ summary: 'List enrollments' })
  @ApiResponse({ status: 200, description: 'Returns all enrollments.' })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic')
  @ApiOperation({ summary: 'Get enrollment' })
  @ApiParam({ name: 'id', description: 'Enrollment UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns enrollment details.' })
  @ApiResponse({ status: 404, description: 'Enrollment not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user);
  }

  @Put(':id/status')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance')
  @ApiOperation({ summary: 'Update enrollment status' })
  @ApiParam({ name: 'id', description: 'Enrollment UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Enrollment status updated successfully.' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateStatus(id, dto, user.userId);
  }

  @Post(':id/transfer')
  @Roles('super_admin', 'branch_manager', 'academic')
  @ApiOperation({ summary: 'Transfer enrollment to another group' })
  @ApiParam({ name: 'id', description: 'Enrollment UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ 
    description: 'Transfer enrollment payload',
    schema: {
      type: 'object',
      properties: {
        group_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
      },
      required: ['group_id']
    }
  })
  @ApiResponse({ status: 200, description: 'Enrollment transferred successfully.' })
  @ApiResponse({ status: 404, description: 'Enrollment or target group not found.' })
  transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('group_id', ParseUUIDPipe) groupId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.transfer(id, groupId, user.userId);
  }
}