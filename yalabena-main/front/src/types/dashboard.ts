export interface DashboardKpi {
  value: number;
  previous_value: number;
  change_pct: number;
}

export interface DashboardTimeSeriesPoint {
  date: string;
  value: number;
}

export interface DashboardAlertItem {
  id: string;
  title: string;
  description?: string;
  severity: "info" | "warning" | "critical";
  link?: string;
  created_at: string;
}

export interface DashboardRecentLead {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

export interface DashboardRecentPayment {
  id: string;
  receipt_number?: string | null;
  amount: number;
}

export interface DashboardRecentSession {
  id: string;
  title?: string | null;
  date?: string | null;
  group?: { name?: string | null } | null;
}

export interface DashboardMetrics {
  kpis: Record<string, DashboardKpi>;
  time_series: Record<string, DashboardTimeSeriesPoint[]>;
  alerts: DashboardAlertItem[];
  recent_items: {
    leads?: DashboardRecentLead[];
    payments?: DashboardRecentPayment[];
    upcoming_sessions?: DashboardRecentSession[];
    [key: string]: unknown;
  };
  attendance_summary?: {
    present: number;
    absent: number;
    late: number;
  };
}

export type DashboardKind =
  | "super_admin"
  | "branch_manager"
  | "sales"
  | "finance"
  | "academic"
  | "teacher"
  | "student"
  | "hr"
  | "moderator"
  | "auditor"
  | "generic";

export const DASHBOARD_KINDS: DashboardKind[] = [
  "super_admin",
  "branch_manager",
  "sales",
  "finance",
  "academic",
  "teacher",
  "student",
  "hr",
  "moderator",
  "auditor",
  "generic",
];

// Role → dashboard kind precedence (highest first) for multi-role users.
export const DASHBOARD_ROLE_PRECEDENCE: DashboardKind[] = [
  "super_admin",
  "branch_manager",
  "finance",
  "sales",
  "academic",
  "hr",
  "teacher",
  "moderator",
  "auditor",
  "student",
];

// Roles eligible for a role-specific dashboard tab.
export const DASHBOARD_ELIGIBLE_ROLES: Record<string, DashboardKind> = {
  super_admin: "super_admin",
  branch_manager: "branch_manager",
  sales: "sales",
  finance: "finance",
  academic: "academic",
  teacher: "teacher",
  student: "student",
  hr: "hr",
  moderator: "moderator",
  auditor: "auditor",
};