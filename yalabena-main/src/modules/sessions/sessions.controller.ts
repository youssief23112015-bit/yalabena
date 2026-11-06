import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { Session } from '../../shared/entities/session.entity';
import { ApplyZoomLinkDto } from './dto/apply-zoom-link.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AttendancesService } from '../attendance/attendance.service';

@ApiTags('Sessions')
@ApiBearerAuth('JWT')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly service: SessionsService,
    private readonly attendances: AttendancesService,
  ) {}

  @Post()
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Create a new session (in_person, online, or hybrid with meeting links)' })
  @ApiBody({ 
    description: 'Session creation payload',
    schema: {
      type: 'object',
      properties: {
        groupId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        title: { type: 'string', example: 'Introduction to Grammar' },
        session_type: { type: 'string', enum: ['in_person', 'online', 'hybrid'], example: 'online' },
        classroomId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        start_time: { type: 'string', format: 'date-time', example: '2026-09-01T10:00:00Z' },
        end_time: { type: 'string', format: 'date-time', example: '2026-09-01T12:00:00Z' },
      },
      required: ['groupId', 'title', 'session_type']
    }
  })
  @ApiResponse({ status: 201, description: 'Session created successfully.' })
  async create(@Body() createData: Partial<Session>) {
    return this.service.create(createData);
  }

  @Get()
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher', 'student')
  @ApiOperation({
    summary:
      'Get all sessions with optional group filter (students: scoped to their own groups)',
  })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filter sessions by group' })
  async findAll(
    @Query('groupId') groupId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.service.findAll(groupId, user);
  }

  @Get(':id')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Get session details by id including attendance records' })
  @ApiParam({ name: 'id', description: 'Session UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns session details.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/attendance')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Get attendance records for a specific session' })
  @ApiParam({ name: 'id', description: 'Session UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Returns list of attendance records.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async getAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: any,
  ) {
    return this.service.getAttendance(id, user?.id ?? user?.userId);
  }

  @Put(':id')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Update session details or mark attendance' })
  @ApiParam({ name: 'id', description: 'Session UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ 
    description: 'Session update payload',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Advanced Grammar - Updated' },
        session_type: { type: 'string', enum: ['in_person', 'online', 'hybrid'], example: 'hybrid' },
        status: { type: 'string', example: 'scheduled' },
      },
    }
  })
  @ApiResponse({ status: 200, description: 'Session updated successfully.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updateData: Partial<Session>) {
    return this.service.update(id, updateData);
  }

  @Delete(':id')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Delete a session' })
  @ApiParam({ name: 'id', description: 'Session UUID or ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  // ─── Cancel / attendance / QR check-in (frontend Sessions page) ───

  @Post(':id/cancel')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Cancel a session with a reason' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string },
  ) {
    return this.service.cancel(id, body?.reason);
  }

  @Post(':id/attendance')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Bulk-save attendance for the session (upsert by student)' })
  async recordAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { attendances: { student_id: string; status: any; notes?: string }[] },
    @CurrentUser('id') userId: string,
  ) {
    return this.service.recordAttendance(id, body?.attendances ?? [], userId);
  }

  @Patch(':id/attendance/:attendanceId')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Update one attendance record (status/notes)' })
  async updateAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attendanceId', ParseUUIDPipe) attendanceId: string,
    @Body() body: { status?: any; notes?: string },
  ) {
    return this.service.updateAttendance(id, attendanceId, body ?? {});
  }

  @Post(':id/qr-code')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: "Generate today's signed check-in code for the session QR card" })
  async generateQrCode(@Param('id', ParseUUIDPipe) id: string) {
    // The code is an HMAC of session+day; students scan/post it to self check-in.
    const check_in_code = this.attendances.generateCheckInCode(id);
    return { qr_code: check_in_code, check_in_code };
  }

  @Post(':id/check-in')
  @Roles('student', 'super_admin', 'teacher')
  @ApiOperation({ summary: 'Self check-in with the session QR code' })
  async selfCheckIn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { code: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.attendances.selfCheckIn(
      { session_id: id, code: body?.code },
      userId,
    );
  }

  @Post(':id/lock-attendance')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({ summary: 'Lock attendance for the session (no further edits)' })
  async lockAttendance(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.lockAttendance(id);
  }

  @Patch(':id/zoom-link')
  @Roles('super_admin', 'academic', 'branch_manager', 'teacher')
  @ApiOperation({
    summary:
      'Apply/edit Zoom link for a session (Admin/Staff only). Optionally propagate to all sessions in the same group.',
  })
  @ApiParam({
    name: 'id',
    description: 'Session UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    description: 'Zoom link payload',
    schema: {
      type: 'object',
      properties: {
        zoom_join_url: { type: 'string', example: 'https://zoom.us/j/123456789' },
        zoom_meeting_id: { type: 'string', example: '123456789' },
        apply_to_all_group_sessions: { type: 'boolean', example: false },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Zoom link applied successfully.' })
  @ApiResponse({ status: 404, description: 'Session not found.' })
  async applyZoomLink(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyZoomLinkDto,
  ) {
    return this.service.applyZoomLink(id, dto);
  }
}