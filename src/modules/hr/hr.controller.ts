import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HrService, HrActor } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { TerminateEmployeeDto } from './dto/terminate-employee.dto';
import { AddDocumentDto } from './dto/add-document.dto';
import { SetAvailabilityDto, UpdateAvailabilityDto } from './dto/set-availability.dto';
import { RequestLeaveDto } from './dto/request-leave.dto';
import { DecideLeaveDto } from './dto/decide-leave.dto';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { CreatePayrollEntryDto } from './dto/create-payroll-entry.dto';
import { ListEmployeesQueryDto, ListLeavesQueryDto } from './dto/query.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { AddMyDocumentDto } from './dto/add-my-document.dto';
import { MyPayrollQueryDto } from './dto/my-payroll-query.dto';

/** request.user (JwtStrategy.validate) -> HrActor. */
const toActor = (u: any): HrActor => ({
  userId: u?.userId ?? u?.id,
  roles: u?.roles ?? [],
  branchId: u?.branchId ?? null,
});

// Authorization is enforced here by the global RolesGuard (and again, where it matters,
// in HrService: branch scoping, own-record checks, compensation visibility).
@ApiTags('HR')
@ApiBearerAuth('JWT')
@Controller('hr')
export class HrController {
  constructor(private readonly service: HrService) {}

  // ---------- Employees ----------
  @Post('employees')
  @Roles('super_admin', 'hr')
  @ApiOperation({ summary: 'Create employee record' })
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.service.createEmployee(dto);
  }

  @Get('employees')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'List employees (search/filter). Compensation only for HR/finance/admin.' })
  findEmployees(@Query() query: ListEmployeesQueryDto, @CurrentUser() user: any) {
    return this.service.findEmployees(query, toActor(user));
  }

  @Get('employees/:id')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'Get employee' })
  findOneEmployee(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findOneEmployee(id, toActor(user));
  }

  @Patch('employees/:id')
  @Roles('super_admin', 'hr')
  @ApiOperation({ summary: 'Update employee record (whitelisted fields)' })
  updateEmployee(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeDto, @CurrentUser() user: any) {
    return this.service.updateEmployee(id, dto, toActor(user));
  }

  @Patch('employees/:id/terminate')
  @Roles('super_admin', 'hr')
  @ApiOperation({ summary: 'Terminate employee' })
  terminateEmployee(@Param('id', ParseUUIDPipe) id: string, @Body() body: TerminateEmployeeDto, @CurrentUser() user: any) {
    return this.service.terminateEmployee(id, body.reason, body.termination_date, toActor(user));
  }

  // ---------- Documents (IDs, contracts: HR / admin only) ----------
  @Post('documents')
  @Roles('super_admin', 'hr')
  @Permissions('hr:create')
  @ApiOperation({ summary: 'Add employee document' })
  addDocument(@Body() dto: AddDocumentDto, @CurrentUser() user: any) {
    return this.service.addDocument(dto, toActor(user));
  }

  @Get('employees/:id/documents')
  @Roles('super_admin', 'hr')
  @Permissions('hr:view')
  @ApiOperation({ summary: 'List employee documents' })
  findDocuments(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findDocuments(id, toActor(user));
  }

  @Delete('documents/:id')
  @Roles('super_admin', 'hr')
  @Permissions('hr:edit')
  @ApiOperation({ summary: 'Remove an employee document' })
  removeDocument(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.removeDocument(id, toActor(user));
  }

  // ---------- Availability ----------
  @Post('availabilities')
  @Roles('super_admin', 'hr', 'teacher')
  @ApiOperation({ summary: 'Add availability slot (teachers: own only)' })
  setAvailability(@Body() dto: SetAvailabilityDto, @CurrentUser() user: any) {
    return this.service.setAvailability(dto, toActor(user));
  }

  @Get('employees/:id/availabilities')
  @Roles('super_admin', 'hr', 'teacher', 'academic')
  @ApiOperation({ summary: 'Get teacher availability (teachers: own only)' })
  findAvailability(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.findAvailability(id, toActor(user));
  }

  @Patch('availabilities/:id')
  @Roles('super_admin', 'hr', 'teacher')
  @ApiOperation({ summary: 'Update availability slot (teachers: own only)' })
  updateAvailability(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAvailabilityDto, @CurrentUser() user: any) {
    return this.service.updateAvailability(id, dto, toActor(user));
  }

  @Delete('availabilities/:id')
  @Roles('super_admin', 'hr', 'teacher')
  @ApiOperation({ summary: 'Delete availability slot (teachers: own only)' })
  deleteAvailability(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.deleteAvailability(id, toActor(user));
  }

  // ---------- Self-service ----------
  @Get('me')
  @Roles('super_admin', 'hr', 'teacher', 'academic', 'sales', 'branch_manager', 'finance')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get current user employee record' })
  getMyEmployee(@CurrentUser() user: any) {
    return this.service.getEmployeeByUserId(toActor(user).userId, toActor(user));
  }

  @Get('me/profile')
  @Roles('super_admin', 'hr', 'teacher', 'academic', 'sales', 'branch_manager', 'finance')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get current user profile (no compensation)' })
  getMyProfile(@CurrentUser() user: any) {
    return this.service.getMyProfile(toActor(user).userId, toActor(user));
  }

  @Patch('me/profile')
  @Roles('super_admin', 'hr', 'teacher', 'academic', 'sales', 'branch_manager', 'finance')
  @Permissions('hr:self:edit')
  @ApiOperation({ summary: 'Update current user profile (permitted fields only)' })
  updateMyProfile(@Body() dto: UpdateMyProfileDto, @CurrentUser() user: any) {
    return this.service.updateMyProfile(toActor(user).userId, dto, toActor(user));
  }

  @Get('my-leaves')
  @Roles('super_admin', 'hr', 'teacher', 'academic', 'sales', 'branch_manager', 'finance')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get current user leave requests' })
  getMyLeaves(@CurrentUser() user: any) {
    const actor = toActor(user);
    return this.service.findMyLeaves(actor.userId, actor);
  }

  @Get('me/groups')
  @Roles('super_admin', 'hr', 'teacher', 'academic')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get groups assigned to the current teacher' })
  getMyGroups(@CurrentUser() user: any) {
    return this.service.getMyGroups(toActor(user).userId, toActor(user).roles, toActor(user));
  }

  @Get('me/students')
  @Roles('super_admin', 'hr', 'teacher', 'academic')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get students in the current teacher\'s groups' })
  getMyStudents(@CurrentUser() user: any) {
    return this.service.getMyStudents(toActor(user).userId, toActor(user).roles, toActor(user));
  }

  @Get('me/sessions')
  @Roles('super_admin', 'hr', 'teacher', 'academic')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get teaching sessions for the current teacher' })
  getMySessions(@CurrentUser() user: any, @Query() query: any) {
    return this.service.getMySessions(toActor(user).userId, toActor(user).roles, query, toActor(user));
  }

  @Get('me/teaching-hours')
  @Roles('super_admin', 'hr', 'teacher')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get teaching hours from own payroll entries' })
  getMyTeachingHours(@CurrentUser() user: any, @Query() query: any) {
    return this.service.getMyTeachingHours(toActor(user).userId, query?.period_id, toActor(user));
  }

  @Get('me/lms')
  @Roles('super_admin', 'hr', 'teacher', 'academic')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get LMS modules/lessons/resources for the current teacher\'s groups' })
  getMyLmsInfo(@CurrentUser() user: any) {
    return this.service.getMyLmsInfo(toActor(user).userId, toActor(user).roles, toActor(user));
  }

  @Get('me/evaluations')
  @Roles('super_admin', 'hr', 'teacher', 'academic')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get teacher evaluations for the current teacher' })
  getMyEvaluations(@CurrentUser() user: any) {
    return this.service.getMyEvaluations(toActor(user).userId, toActor(user).roles, toActor(user));
  }

  @Get('me/payroll')
  @Roles('super_admin', 'hr', 'teacher', 'academic', 'sales', 'branch_manager', 'finance')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get current user\'s payroll entries' })
  getMyPayrollEntries(@CurrentUser() user: any, @Query() query: MyPayrollQueryDto) {
    return this.service.getMyPayrollEntries(toActor(user).userId, query, toActor(user));
  }

  @Get('me/documents')
  @Roles('super_admin', 'hr', 'teacher', 'academic', 'sales', 'branch_manager', 'finance')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get current user\'s employee documents' })
  getMyDocuments(@CurrentUser() user: any) {
    return this.service.getMyDocuments(toActor(user).userId, toActor(user));
  }

  @Post('me/documents')
  @Roles('super_admin', 'hr', 'teacher', 'academic', 'sales', 'branch_manager', 'finance')
  @Permissions('hr:self:edit')
  @ApiOperation({ summary: 'Add a document to the current user\'s employee record' })
  addMyDocument(@Body() dto: AddMyDocumentDto, @CurrentUser() user: any) {
    return this.service.addMyDocument(toActor(user).userId, dto, toActor(user));
  }

  @Get('me/leads')
  @Roles('super_admin', 'hr', 'sales', 'branch_manager')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get sales leads assigned to the current user' })
  getMyLeads(@CurrentUser() user: any) {
    return this.service.getMyLeads(toActor(user).userId, toActor(user).roles);
  }

  @Get('me/sales-targets')
  @Roles('super_admin', 'hr', 'sales', 'branch_manager')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get sales targets for the current user' })
  getMySalesTargets(@CurrentUser() user: any) {
    return this.service.getMySalesTargets(toActor(user).userId, toActor(user).roles);
  }

  @Get('me/academic')
  @Roles('super_admin', 'hr', 'academic')
  @Permissions('hr:self:view')
  @ApiOperation({ summary: 'Get academic responsibilities for the current user' })
  getMyAcademicData(@CurrentUser() user: any) {
    return this.service.getMyAcademicData(toActor(user).userId, toActor(user).roles, toActor(user));
  }

  // ---------- Leave Requests ----------
  @Post('leaves')
  @Roles('super_admin', 'hr', 'teacher')
  @ApiOperation({ summary: 'Request leave (own; HR/admin may file for an employee). days_count is server-computed.' })
  requestLeave(@Body() dto: RequestLeaveDto, @CurrentUser() user: any) {
    return this.service.requestLeave(dto, toActor(user));
  }

  @Get('leaves')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'List leave requests (branch managers: own branch)' })
  findLeaves(@Query() query: ListLeavesQueryDto, @CurrentUser() user: any) {
    return this.service.findLeaves(query, toActor(user));
  }

  @Put('leaves/:id/cancel')
  @Roles('super_admin', 'hr', 'teacher')
  @ApiOperation({ summary: 'Cancel own pending leave request' })
  cancelMyLeave(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.cancelMyLeave(id, toActor(user).userId);
  }

  @Put('leaves/:id/approve')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'Approve a pending leave (not your own)' })
  approveLeave(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DecideLeaveDto, @CurrentUser() user: any) {
    return this.service.approveLeave(id, toActor(user), dto?.note);
  }

  @Put('leaves/:id/reject')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'Reject a pending leave (not your own)' })
  rejectLeave(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DecideLeaveDto, @CurrentUser() user: any) {
    return this.service.rejectLeave(id, toActor(user), dto?.note);
  }

  // ---------- Payroll ----------
  @Post('payroll-periods')
  @Roles('super_admin', 'hr', 'finance')
  @Permissions('hr:process_payroll')
  @ApiOperation({ summary: 'Create payroll period' })
  createPeriod(@Body() dto: CreatePayrollPeriodDto, @CurrentUser() user: any) {
    return this.service.createPeriod(dto, toActor(user));
  }

  @Get('payroll-periods')
  @Roles('super_admin', 'hr', 'finance')
  @ApiOperation({ summary: 'List payroll periods' })
  findPeriods() {
    return this.service.findPeriods();
  }

  @Patch('payroll-periods/:id/close')
  @Roles('super_admin', 'hr', 'finance')
  @ApiOperation({ summary: 'Close a payroll period' })
  closePeriod(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.closePeriod(id, toActor(user).userId);
  }

  @Post('payroll-periods/:id/calculate-teachers')
  @Roles('super_admin', 'hr', 'finance')
  @ApiOperation({ summary: 'Auto-calculate payroll from taught hours (SRS 4.10)' })
  calculateTeacherPayroll(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.calculateTeacherPayroll(id);
  }

  @Get('payroll-periods/:id/export')
  @Roles('super_admin', 'hr', 'finance')
  @ApiOperation({ summary: 'Export payroll entries (CSV, opens in Excel)' })
  async exportPayroll(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const { filename, csv } = await this.service.exportPayrollCsv(id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Post('payroll-entries')
  @Roles('super_admin', 'hr', 'finance')
  @Permissions('hr:process_payroll')
  @ApiOperation({ summary: 'Create payroll entry (amounts derived from the employee record)' })
  createPayrollEntry(@Body() dto: CreatePayrollEntryDto, @CurrentUser() user: any) {
    return this.service.createPayrollEntry(dto, toActor(user));
  }

  @Get('payroll-periods/:id/entries')
  @Roles('super_admin', 'hr', 'finance')
  @ApiOperation({ summary: 'List payroll entries of a period' })
  findPayrollEntries(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findPayrollEntries(id);
  }
}
