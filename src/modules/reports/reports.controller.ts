import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth('JWT')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('sales-funnel')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Sales funnel report' })
  salesFunnel(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: any,
  ) {
    const branchId = user.roles?.includes('super_admin') ? null : user.branchId;
    return this.service.salesFunnel(branchId, new Date(from), new Date(to));
  }

  @Get('lead-source-roi')
  @Roles('super_admin', 'branch_manager', 'sales')
  @ApiOperation({ summary: 'Lead source ROI' })
  leadSourceRoi(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: any,
  ) {
    const branchId = user.roles?.includes('super_admin') ? null : user.branchId;
    return this.service.leadSourceRoi(branchId, new Date(from), new Date(to));
  }

  @Get('group-fill-rate')
  @Roles('super_admin', 'branch_manager', 'academic')
  @ApiOperation({ summary: 'Group fill rate' })
  groupFillRate(@CurrentUser() user: any) {
    const branchId = user.roles?.includes('super_admin') ? null : user.branchId;
    return this.service.groupFillRate(branchId);
  }

  @Get('teacher-utilization')
  @Roles('super_admin', 'branch_manager', 'hr')
  @ApiOperation({ summary: 'Teacher utilization' })
  teacherUtilization(
    @Query('month') month: string,
    @CurrentUser() user: any,
  ) {
    const branchId = user.roles?.includes('super_admin') ? null : user.branchId;
    return this.service.teacherUtilization(branchId, month);
  }

  @Get('student-progress')
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher')
  @ApiOperation({ summary: 'Student progress' })
  studentProgress(@Query('student_id') studentId: string) {
    return this.service.studentProgress(studentId);
  }

  @Get('revenue')
  @Roles('super_admin', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'Revenue by period' })
  revenue(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: any,
  ) {
    const branchId = user.roles?.includes('super_admin') ? null : user.branchId;
    return this.service.revenueByPeriod(branchId, new Date(from), new Date(to));
  }

  @Get('outstanding-payments')
  @Roles('super_admin', 'branch_manager', 'finance')
  @ApiOperation({ summary: 'Outstanding payments' })
  outstandingPayments(@CurrentUser() user: any) {
    const branchId = user.roles?.includes('super_admin') ? null : user.branchId;
    return this.service.outstandingPayments(branchId);
  }

  @Get('attendance')
  @Roles('super_admin', 'branch_manager', 'academic', 'teacher')
  @ApiOperation({ summary: 'Attendance report' })
  attendanceReport(
    @Query('group_id') groupId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.attendanceReport(groupId, new Date(from), new Date(to));
  }
}
