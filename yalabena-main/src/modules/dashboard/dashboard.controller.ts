import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dashboard.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT')
@UsePipes(new ValidationPipe({ whitelist: true }))
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  @Roles('super_admin', 'branch_manager', 'sales', 'finance', 'academic', 'teacher', 'student', 'hr', 'moderator', 'auditor')
  @ApiOperation({ summary: 'Aggregated KPIs for the dashboard (branch-scoped)' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', '30d', 'month', 'quarter', 'year', 'custom'] })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  getStats(@CurrentUser() user: any, @Query() dto: DashboardQueryDto) {
    return this.service.getStats(user, dto);
  }

  @Get('finance')
  @Roles('finance', 'super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Finance officer dashboard metrics' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', '30d', 'month', 'quarter', 'year', 'custom'] })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  getFinance(@CurrentUser() user: any, @Query() dto: DashboardQueryDto) {
    return this.service.getFinanceMetrics(user, dto);
  }

  @Get('sales')
  @Roles('sales', 'super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Sales dashboard metrics' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', '30d', 'month', 'quarter', 'year', 'custom'] })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  getSales(@CurrentUser() user: any, @Query() dto: DashboardQueryDto) {
    return this.service.getSalesMetrics(user, dto);
  }

  @Get('academic')
  @Roles('academic', 'super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Academic coordinator dashboard metrics' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', '30d', 'month', 'quarter', 'year', 'custom'] })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  getAcademic(@CurrentUser() user: any, @Query() dto: DashboardQueryDto) {
    return this.service.getAcademicMetrics(user, dto);
  }

  @Get('teacher')
  @Roles('teacher', 'super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Teacher dashboard metrics (self-scoped)' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', '30d', 'month', 'quarter', 'year', 'custom'] })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'teacher_id', required: false, type: String, description: 'super_admin/branch_manager preview only' })
  getTeacher(@CurrentUser() user: any, @Query() dto: DashboardQueryDto) {
    return this.service.getTeacherMetrics(user, dto);
  }

  @Get('student')
  @Roles('student', 'super_admin', 'branch_manager')
  @ApiOperation({ summary: 'Student dashboard metrics (self-scoped)' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', '30d', 'month', 'quarter', 'year', 'custom'] })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'student_id', required: false, type: String, description: 'super_admin/branch_manager preview only' })
  getStudent(@CurrentUser() user: any, @Query() dto: DashboardQueryDto) {
    return this.service.getStudentMetrics(user, dto);
  }

  @Get('hr')
  @Roles('hr', 'super_admin', 'branch_manager')
  @ApiOperation({ summary: 'HR dashboard metrics' })
  @ApiQuery({ name: 'period', required: false, enum: ['today', '7d', '30d', 'month', 'quarter', 'year', 'custom'] })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  getHr(@CurrentUser() user: any, @Query() dto: DashboardQueryDto) {
    return this.service.getHrMetrics(user, dto);
  }
}
