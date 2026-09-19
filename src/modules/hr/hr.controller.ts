import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, ParseUUIDPipe, Header, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HrService } from './hr.service';

// Import the new DTOs
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { AddDocumentDto } from './dto/add-document.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { RequestLeaveDto } from './dto/request-leave.dto';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { CreatePayrollEntryDto } from './dto/create-payroll-entry.dto';

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
  @ApiOperation({ summary: 'List employees' })
  findEmployees(@Query() query: any) {
    return this.service.findEmployees(query);
  }

  @Get('employees/:id')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'Get employee' })
  findOneEmployee(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneEmployee(id);
  }

  @Patch('employees/:id')
  @Roles('super_admin', 'hr')
  @ApiOperation({ summary: 'Update employee record' })
  updateEmployee(@Param('id', ParseUUIDPipe) id: string, @Body() dto: any) {
    return this.service.updateEmployee(id, dto);
  }

  @Patch('employees/:id/terminate')
  @Roles('super_admin', 'hr')
  @ApiOperation({ summary: 'Terminate employee' })
  terminateEmployee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string; termination_date?: string },
  ) {
    return this.service.terminateEmployee(id, body.reason, body.termination_date);
  }

  // ---------- Documents ----------
  @Post('documents')
  @Roles('super_admin', 'hr')
  @ApiOperation({ summary: 'Add employee document' })
  addDocument(@Body() dto: AddDocumentDto) {
    return this.service.addDocument(dto);
  }

  @Get('employees/:id/documents')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'List employee documents' })
  findDocuments(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findDocuments(id);
  }

  @Delete('documents/:id')
  @Roles('super_admin', 'hr')
  @ApiOperation({ summary: 'Remove an employee document' })
  removeDocument(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.removeDocument(id);
  }

  // ---------- Availability ----------
  @Post('availabilities')
  @Roles('super_admin', 'hr', 'teacher')
  @ApiOperation({ summary: 'Set teacher availability' })
  setAvailability(@Body() dto: SetAvailabilityDto) {
    return this.service.setAvailability(dto);
  }

  @Get('employees/:id/availabilities')
  @Roles('super_admin', 'hr', 'teacher', 'academic')
  @ApiOperation({ summary: 'Get teacher availability' })
  findAvailability(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findAvailability(id);
  }

  // ---------- Leave Requests ----------
  @Post('leaves')
  @Roles('super_admin', 'hr', 'teacher')
  @ApiOperation({ summary: 'Request leave' })
  requestLeave(@Body() dto: RequestLeaveDto) {
    return this.service.requestLeave(dto);
  }

  @Get('leaves')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'List leave requests' })
  findLeaves(@Query() query: any) {
    return this.service.findLeaves(query);
  }

  @Put('leaves/:id/approve')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'Approve leave' })
  approveLeave(@Param('id', ParseUUIDPipe) id: string, @Body('note') note: string, @CurrentUser() user: any) {
    return this.service.approveLeave(id, user.userId, note);
  }

  @Put('leaves/:id/reject')
  @Roles('super_admin', 'hr', 'branch_manager')
  @ApiOperation({ summary: 'Reject leave' })
  rejectLeave(@Param('id', ParseUUIDPipe) id: string, @Body('note') note: string, @CurrentUser() user: any) {
    return this.service.rejectLeave(id, user.userId, note);
  }

  // ---------- Payroll ----------
  @Post('payroll-periods')
  @Roles('super_admin', 'hr', 'finance')
  @ApiOperation({ summary: 'Create payroll period' })
  createPeriod(@Body() dto: CreatePayrollPeriodDto) {
    return this.service.createPeriod(dto);
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
    return this.service.closePeriod(id, user.userId);
  }

  @Post('payroll-periods/:id/calculate-teachers')
  @Roles('super_admin', 'hr', 'finance')
  @ApiOperation({ summary: 'Auto-calculate teacher payouts (SRS 4.10)' })
  calculateTeacherPayroll(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.calculateTeacherPayroll(id);
  }

  @Get('payroll-periods/:id/export')
  @Roles('super_admin', 'hr', 'finance')
  @ApiOperation({ summary: 'Export payroll entries as CSV' })
  @Header('Content-Type', 'text/csv')
  async exportPayroll(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const { filename, csv } = await this.service.exportPayrollCsv(id);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Post('payroll-entries')
  @Roles('super_admin', 'hr', 'finance')
  @ApiOperation({ summary: 'Create payroll entry' })
  createPayrollEntry(@Body() dto: CreatePayrollEntryDto) {
    return this.service.createPayrollEntry(dto);
  }

  @Get('payroll-periods/:id/entries')
  @Roles('super_admin', 'hr', 'finance')
  @ApiOperation({ summary: 'List payroll entries of a period' })
  findPayrollEntries(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findPayrollEntries(id);
  }
}