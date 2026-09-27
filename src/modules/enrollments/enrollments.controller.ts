import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/utils/branch-scope';

@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Post()
  @Roles('super_admin', 'branch_manager', 'sales', 'finance')
  create(@Body() dto: CreateEnrollmentDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic')
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('student_id') student_id?: string,
    @Query('group_id') group_id?: string,
    @Query('status') status?: string,
    @Query('branch_id') branch_id?: string,
  ) {
    return this.service.findAll(user, { student_id, group_id, status, branch_id });
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'branch_manager', 'finance')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateStatus(id, dto, user);
  }

  @Post(':id/drop')
  @Roles('super_admin', 'branch_manager', 'finance')
  drop(@Param('id', ParseUUIDPipe) id: string, @Body('reason') reason: string, @CurrentUser() user: AuthUser) {
    return this.service.drop(id, reason, user);
  }
}
