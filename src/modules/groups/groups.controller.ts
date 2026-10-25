import { Body, Controller, Get, Post, Put, Patch, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { SessionSchedulingService } from '../sessions/scheduling.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { RescheduleGroupDto } from './dto/reschedule-group.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/utils/branch-scope';

@ApiTags('Groups')
@ApiBearerAuth('JWT')
@Controller('groups')
export class GroupsController {
  constructor(
    private readonly service: GroupsService,
    private readonly scheduling: SessionSchedulingService,
  ) {}

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
  @ApiQuery({ name: 'day_of_week', required: false, description: 'Weekday 0=Sun..6=Sat — enables time-overlap checks' })
  @ApiQuery({ name: 'start_time', required: false })
  @ApiQuery({ name: 'end_time', required: false })
  @ApiQuery({ name: 'excludeGroupId', required: false })
  async checkConflicts(
    @Query('teacherId') teacherId?: string,
    @Query('classroomId') classroomId?: string,
    @Query('day_of_week') dayOfWeek?: string,
    @Query('start_time') startTime?: string,
    @Query('end_time') endTime?: string,
    @Query('excludeGroupId') excludeGroupId?: string,
  ) {
    const day =
      dayOfWeek !== undefined && dayOfWeek !== null && dayOfWeek !== '' && !Number.isNaN(Number(dayOfWeek))
        ? Number(dayOfWeek)
        : undefined;
    return this.service.checkConflicts({
      teacherId,
      classroomId,
      dayOfWeek: day,
      startTime,
      endTime,
      excludeGroupId,
    });
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

  /**
   * Automatic recurring-session scheduling: validate the group's weekly
   * schedule (config, meeting URL, teacher/room conflicts) WITHOUT writing.
   */
  @Get(':id/schedule-validation')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Dry-run validate the recurring schedule before activation (returns occurrences + conflicts)' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  validateSchedule(@Param('id') id: string) {
    return this.scheduling.validate(id);
  }

  /**
   * Activate the group: validates the recurring schedule and generates all
   * Sessions between start/end dates in one transaction. Idempotent — safe
   * to retry; never creates duplicate sessions (partial unique index).
   */
  @Post(':id/activate')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Activate a group and auto-generate its sessions (conflict-checked, idempotent)' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 201, description: 'Group activated; sessions generated.' })
  @ApiResponse({ status: 400, description: 'Invalid schedule or meeting link configuration.' })
  @ApiResponse({ status: 409, description: 'Teacher/room conflict — details in `conflicts`.' })
  activate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.scheduling.activate(id, user);
  }

  /**
   * Update the recurring schedule starting from an effective date. Past
   * sessions and any future session holding attendance are preserved.
   */
  @Post(':id/reschedule')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Change the recurring schedule from an effective date (preserves past/attendance sessions)' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiBody({ type: RescheduleGroupDto })
  @ApiResponse({ status: 201, description: 'Schedule updated; affected future sessions regenerated.' })
  @ApiResponse({ status: 409, description: 'Teacher/room conflict in the new schedule — details in `conflicts`.' })
  reschedule(@Param('id') id: string, @Body() dto: RescheduleGroupDto, @CurrentUser() user: AuthUser) {
    return this.scheduling.reschedule(id, dto, user);
  }

  /**
   * Business Rule 1 — direct teacher assignment (staff only, branch-scoped).
   * 409 on schedule/room conflicts unless body.force = true.
   */
  @Patch(':id/assign-teacher')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Assign / replace the teacher of a group (conflict-checked, force-able)' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiBody({ type: AssignTeacherDto })
  assignTeacher(
    @Param('id') id: string,
    @Body() dto: AssignTeacherDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.assignTeacher(id, dto, user);
  }

  /**
   * Business Rule 2 — direct manual enrollment: ACTIVE enrollment + roster
   * row in one call (capacity → 409 unless body.force = true).
   */
  @Post(':id/students')
  @Roles('super_admin', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Directly enroll a student into the group roster (ACTIVE)' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiBody({ type: AddStudentDto })
  assignStudent(
    @Param('id') id: string,
    @Body() body: AddStudentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.addStudent(id, body, user);
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