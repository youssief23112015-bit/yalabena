import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendancesService } from './attendance.service';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Attendances')
@ApiBearerAuth('JWT')
@Controller('attendances')
export class AttendancesController {
  constructor(private readonly service: AttendancesService) {}

  @Get('sessions/:sessionId/roster')
  @Roles('super_admin', 'teacher', 'academic')
  @ApiOperation({ summary: 'Get session roster (students + recorded attendance)' })
  async getRoster(@Param('sessionId') sessionId: string) {
    return this.service.getRoster(sessionId);
  }

  @Post('sessions/:sessionId/mark')
  @Roles('super_admin', 'teacher', 'academic')
  @ApiOperation({ summary: 'Mark attendance for one student (manual, by teacher)' })
  @ApiResponse({ status: 201, description: 'Attendance recorded.' })
  async mark(
    @Param('sessionId') sessionId: string,
    @Body() dto: MarkAttendanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.mark(sessionId, dto, userId);
  }

  @Post('sessions/:sessionId/bulk-mark')
  @Roles('super_admin', 'teacher', 'academic')
  @ApiOperation({ summary: 'Mark attendance for the whole group in one call' })
  async bulkMark(
    @Param('sessionId') sessionId: string,
    @Body() dto: BulkMarkAttendanceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.bulkMark(sessionId, dto.records, userId);
  }

  @Get('sessions/:sessionId')
  @Roles('super_admin', 'teacher', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Get attendance records for a session' })
  async getForSession(@Param('sessionId') sessionId: string) {
    return this.service.getForSession(sessionId);
  }

  @Post('check-in')
  @Roles('student', 'super_admin', 'teacher')
  @ApiOperation({ summary: 'Student self check-in via QR card / unique code' })
  async selfCheckIn(@Body() dto: CheckInDto, @CurrentUser('id') userId: string) {
    return this.service.selfCheckIn(dto, userId);
  }

  @Get('sessions/:sessionId/check-in-code')
  @Roles('super_admin', 'teacher')
  @ApiOperation({ summary: 'Get today\'s signed check-in code (teacher displays QR)' })
  async getCheckInCode(@Param('sessionId') sessionId: string) {
    return { code: this.service.generateCheckInCode(sessionId) };
  }

  @Get('students/:studentId/report')
  @Roles('super_admin', 'teacher', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Attendance summary for a student' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getStudentReport(
    @Param('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getStudentReport(studentId, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }

  @Get('groups/:groupId/report')
  @Roles('super_admin', 'teacher', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Attendance report for a whole group' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getGroupReport(
    @Param('groupId') groupId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.getGroupReport(groupId, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }

  @Get('alerts/absences')
  @Roles('super_admin', 'teacher', 'academic', 'branch_manager')
  @ApiOperation({ summary: 'Students who exceeded the absence threshold' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiQuery({ name: 'group_id', required: false, type: String })
  async absenceAlerts(@Query('threshold') threshold?: string, @Query('group_id') groupId?: string) {
    return this.service.absenceAlerts(threshold ? Number(threshold) : 3, groupId || undefined);
  }
}
