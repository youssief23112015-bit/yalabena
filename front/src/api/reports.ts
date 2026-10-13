import apiClient from "./client";

export type ReportRow = Record<string, unknown>;
export interface ReportDateRange { from: string; to: string }

export const reportsApi = {
  salesFunnel: (range: ReportDateRange) => apiClient.get<ReportRow[]>("/reports/sales-funnel", { params: range }).then((r) => r.data),
  leadSourceRoi: (range: ReportDateRange) => apiClient.get<ReportRow[]>("/reports/lead-source-roi", { params: range }).then((r) => r.data),
  groupFillRate: () => apiClient.get<ReportRow[]>("/reports/group-fill-rate").then((r) => r.data),
  teacherUtilization: (month: string) => apiClient.get<ReportRow[]>("/reports/teacher-utilization", { params: { month } }).then((r) => r.data),
  studentProgress: (student_id: string) => apiClient.get<Record<string, unknown>>("/reports/student-progress", { params: { student_id } }).then((r) => r.data),
  revenue: (range: ReportDateRange) => apiClient.get<ReportRow[]>("/reports/revenue", { params: range }).then((r) => r.data),
  outstandingPayments: () => apiClient.get<ReportRow[]>("/reports/outstanding-payments").then((r) => r.data),
  attendance: (params: ReportDateRange & { group_id: string }) => apiClient.get<ReportRow[]>("/reports/attendance", { params }).then((r) => r.data),
};
