import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Groups')
@ApiBearerAuth('JWT')
@Controller('groups')
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  @Post()
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Create a new group/class schedule' })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({ status: 201, description: 'Group created successfully.' })
  async create(@Body() dto: CreateGroupDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Get all groups with optional branch or course filters' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  async findAll(
    @Query('branchId') branchId?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.service.findAll({ branchId, courseId });
  }

  // STATIC ROUTES MUST COME BEFORE :id PARAMETER ROUTE
  @Get('check-conflicts')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Check for scheduling conflicts' })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'classroomId', required: false })
  @ApiQuery({ name: 'start_time', required: false })
  @ApiQuery({ name: 'end_time', required: false })
  @ApiQuery({ name: 'excludeGroupId', required: false })
  async checkConflicts(
    @Query('teacherId') teacherId?: string,
    @Query('classroomId') classroomId?: string,
    @Query('start_time') startTime?: string,
    @Query('end_time') endTime?: string,
    @Query('excludeGroupId') excludeGroupId?: string,
  ) {
    return this.service.checkConflicts({ teacherId, classroomId, startTime, endTime, excludeGroupId });
  }

  @Get('calendar')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Get group calendar' })
  @ApiQuery({ name: 'view', required: true })
  @ApiQuery({ name: 'date', required: true })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiQuery({ name: 'classroomId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  async getCalendar(
    @Query('view') view: 'day' | 'week' | 'month',
    @Query('date') date: string,
    @Query('teacherId') teacherId?: string,
    @Query('classroomId') classroomId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.service.getCalendar({ view, date, teacherId, classroomId, branchId });
  }

  @Get(':id')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Get group details by id with relations' })
  @ApiParam({ name: 'id', description: 'Group UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns group details.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Update group details' })
  @ApiParam({ name: 'id', description: 'Group UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateGroupDto })
  @ApiResponse({ status: 200, description: 'Group updated successfully.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Delete a group' })
  @ApiParam({ name: 'id', description: 'Group UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Group deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Group not found.' })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/schedule')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Add schedule to group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  async addSchedule(@Param('id') id: string, @Body() schedule: any) {
    return this.service.addSchedule(id, schedule);
  }

  @Delete(':id/schedule/:scheduleId')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Remove schedule from group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiParam({ name: 'scheduleId', description: 'Schedule UUID' })
  async removeSchedule(@Param('id') id: string, @Param('scheduleId') scheduleId: string) {
    return this.service.removeSchedule(id, scheduleId);
  }

  @Post(':id/students')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Assign student to group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  async assignStudent(@Param('id') id: string, @Body() body: { student_id: string }) {
    return this.service.assignStudent(id, body.student_id);
  }

  @Delete(':id/students/:studentId')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Remove student from group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiParam({ name: 'studentId', description: 'Student UUID' })
  async removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.service.removeStudent(id, studentId);
  }
}