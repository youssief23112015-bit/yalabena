import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WaitlistsService } from './waitlists.service';
import { AssignToGroupDto, BulkAssignToGroupDto } from './dto/assign-to-group.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Waitlists')
@ApiBearerAuth('JWT')
@Controller('waitlists')
export class WaitlistsController {
  constructor(private readonly service: WaitlistsService) {}

  @Get()
  @Roles('super_admin', 'branch_manager', 'sales', 'academic')
  @ApiOperation({ summary: 'List waitlist entries (filter by branch / level / status / course)' })
  @ApiQuery({ name: 'branch_id', required: false })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'course_id', required: false })
  async findAll(
    @Query('branch_id') branchId?: string,
    @Query('level') level?: string,
    @Query('status') status?: string,
    @Query('course_id') courseId?: string,
  ) {
    return this.service.findAll({ branchId, level, status, courseId });
  }

  @Get('threshold-report')
  @Roles('super_admin', 'branch_manager', 'sales', 'academic')
  @ApiOperation({ summary: 'Levels/branches with enough waiting students to open a new class' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  async thresholdReport(@Query('threshold') threshold?: string) {
    return this.service.thresholdReport(threshold ? Number(threshold) : 8);
  }

  @Get(':id')
  @Roles('super_admin', 'branch_manager', 'sales', 'academic')
  @ApiOperation({ summary: 'Get one waitlist entry' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/assign')
  @Roles('super_admin', 'branch_manager', 'academic', 'sales')
  @ApiOperation({ summary: 'Enroll waitlisted student into a group (capacity hard-stop)' })
  async assignToGroup(
    @Param('id') id: string,
    @Body() dto: AssignToGroupDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.assignToGroup(id, dto.group_id, userId);
  }

  @Post('bulk-assign')
  @Roles('super_admin', 'branch_manager', 'academic', 'sales')
  @ApiOperation({ summary: 'Enroll many waitlisted students into a group at once' })
  async bulkAssign(@Body() dto: BulkAssignToGroupDto, @CurrentUser('id') userId: string) {
    return this.service.bulkAssignToGroup(dto.waitlist_ids, dto.group_id, userId);
  }

  @Delete(':id')
  @Roles('super_admin', 'branch_manager', 'academic', 'sales')
  @ApiOperation({ summary: 'Remove an entry from the waitlist' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
