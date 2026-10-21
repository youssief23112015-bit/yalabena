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
  @Roles('super_admin', 'sales')
  @ApiOperation({ summary: 'Sales funnel report' })
  salesFunnel(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.salesFunnel(new Date(from), new Date(to));
  }

  @Get('lead-source-roi')
  @Roles('super_admin', 'sales')
  @ApiOperation({ summary: 'Lead source ROI' })
  leadSourceRoi(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.leadSourceRoi(new Date(from), new Date(to));
  }

  @Get('group-fill-rate')
  @Roles('super_admin', 'academic')
  @ApiOperation({ summary: 'Group fill rate' })
  groupFillRate() {
    return this.service.groupFillRate();
  }

  @Get('teacher-utilization')
  @Roles('super_admin', 'hr')
  @ApiOperation({ summary: 'Teacher utilization' })
  teacherUtilization(
    @Query('month') month: string,
  ) {
    return this.service.teacherUtilization(month);
  }

  @Get('student-progress')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Student progress' })
  studentProgress(@Query('student_id') studentId: string) {
    return this.service.studentProgress(studentId);
  }

  @Get('revenue')
  @Roles('super_admin', 'finance')
  @ApiOperation({ summary: 'Revenue by period' })
  revenue(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.revenueByPeriod(new Date(from), new Date(to));
  }

  @Get('outstanding-payments')
  @Roles('super_admin', 'finance')
  @ApiOperation({ summary: 'Outstanding payments' })
  outstandingPayments() {
    return this.service.outstandingPayments();
  }

  @Get('attendance')
  @Roles('super_admin', 'academic', 'teacher')
  @ApiOperation({ summary: 'Attendance report' })
  attendanceReport(
    @Query('group_id') groupId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.attendanceReport(groupId, new Date(from), new Date(to));
  }
}
