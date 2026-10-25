import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminMetricService } from './metrics/admin-metric.service';
import { TeacherMetricService } from './metrics/teacher-metric.service';
import { StudentMetricService } from './metrics/student-metric.service';
import { HrMetricService } from './metrics/hr-metric.service';
import { FinanceMetricService } from './metrics/finance-metric.service';
import { SalesMetricService } from './metrics/sales-metric.service';
import { AcademicMetricService } from './metrics/academic-metric.service';
import { AuthUser } from '../../common/utils/branch-scope';
import { DashboardQueryDto } from './dashboard.dto';

/**
 * Aggregated KPIs for the dashboard header (SRS 4.2 / 4.17).
 * All counts respect the caller's branch scope (super_admin sees everything).
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly config: ConfigService,
    private readonly adminMetric: AdminMetricService,
    private readonly teacherMetric: TeacherMetricService,
    private readonly studentMetric: StudentMetricService,
    private readonly hrMetric: HrMetricService,
    private readonly financeMetric: FinanceMetricService,
    private readonly salesMetric: SalesMetricService,
    private readonly academicMetric: AcademicMetricService,
  ) {}

  private resolveService(roles: string[]): string {
    if (roles.some((r) => ['super_admin', 'branch_manager', 'moderator', 'auditor'].includes(r))) return 'admin';
    if (roles.includes('hr')) return 'hr';
    if (roles.includes('teacher')) return 'teacher';
    if (roles.includes('student')) return 'student';
    if (roles.includes('sales')) return 'sales';
    if (roles.includes('finance')) return 'finance';
    if (roles.includes('academic')) return 'academic';
    return 'admin';
  }

  async getMetrics(user: AuthUser, dto: DashboardQueryDto) {
    const roles = user?.roles ?? [];

    const serviceKey = this.resolveService(roles);

    switch (serviceKey) {
      case 'admin':
        return this.adminMetric.getMetrics(user, dto);
      case 'teacher':
        return this.teacherMetric.getMetrics(user, dto);
      case 'student':
        return this.studentMetric.getMetrics(user, dto);
      case 'hr':
        return this.hrMetric.getMetrics(user, dto);
      case 'finance':
        return this.financeMetric.getMetrics(user, dto);
      case 'sales':
        return this.salesMetric.getMetrics(user, dto);
      case 'academic':
        return this.academicMetric.getMetrics(user, dto);
      default:
        return this.adminMetric.getMetrics(user, dto);
    }
  }

  async getStats(user: AuthUser, dto?: DashboardQueryDto) {
    return this.adminMetric.getMetrics(user, dto ?? {});
  }

  async getFinanceMetrics(user: AuthUser, dto: DashboardQueryDto) {
    return this.financeMetric.getMetrics(user, dto);
  }

  async getSalesMetrics(user: AuthUser, dto: DashboardQueryDto) {
    return this.salesMetric.getMetrics(user, dto);
  }

  async getAcademicMetrics(user: AuthUser, dto: DashboardQueryDto) {
    return this.academicMetric.getMetrics(user, dto);
  }

  async getTeacherMetrics(user: AuthUser, dto: DashboardQueryDto) {
    return this.teacherMetric.getMetrics(user, dto);
  }

  async getStudentMetrics(user: AuthUser, dto: DashboardQueryDto) {
    return this.studentMetric.getMetrics(user, dto);
  }

  async getHrMetrics(user: AuthUser, dto: DashboardQueryDto) {
    return this.hrMetric.getMetrics(user, dto);
  }
}
