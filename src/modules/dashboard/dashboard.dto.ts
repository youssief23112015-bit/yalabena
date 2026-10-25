import { IsDateString, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { GroupMode } from '../../common/enums/group-mode.enum';
import { GroupStatus } from '../../common/enums/group-status.enum';
import { LeadStatus } from '../../common/enums/lead-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';
import { AttendanceStatus } from '../../common/enums/attendance-status.enum';
import { StudentStatus } from '../../common/enums/student-status.enum';
import { EnrollmentStatus } from '../../common/enums/enrollment-status.enum';

export class DashboardQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  include_previous?: boolean;
}

export interface KpiResult {
  value: number;
  previous_value: number;
  change_pct: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  link?: string;
  created_at: string;
}

export interface DashboardMetrics {
  kpis: Record<string, KpiResult>;
  time_series: Record<string, TimeSeriesPoint[]>;
  alerts: AlertItem[];
  recent_items: Record<string, any[]>;
}

export const DASHBOARD_ROLES = [
  'super_admin',
  'branch_manager',
  'sales',
  'finance',
  'academic',
  'teacher',
  'student',
  'moderator',
  'hr',
  'auditor',
] as const;

export type DashboardRole = (typeof DASHBOARD_ROLES)[number];