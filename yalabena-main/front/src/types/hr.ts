export type EmployeeType = "full_time" | "part_time" | "contract" | "hourly";
export type EmployeeStatus = "active" | "on_leave" | "terminated" | "suspended";
export type DocumentType = "contract" | "id" | "certificate" | "visa" | "other";
export type LeaveType = "annual" | "sick" | "emergency" | "unpaid" | "other";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type PayrollStatus = "open" | "processing" | "closed" | "exported";
export type PayrollEntryStatus = "draft" | "approved" | "paid";

import type { User } from "@/types";

export interface Employee {
  id: string;
  user_id: string;
  employee_number?: string | null;
  employee_type: EmployeeType;
  department?: string | null;
  job_title: string;
  contract_start: string;
  contract_end?: string | null;
  salary?: number | null;
  hourly_rate?: number | null;
  currency?: string;
  bank_account?: string | null;
  bank_name?: string | null;
  status: EmployeeStatus;
  termination_date?: string | null;
  termination_reason?: string | null;
  user?: User;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeDocument {
  id: string;
  employee_id: string;
  name: string;
  file_url: string;
  document_type: DocumentType;
  expiry_date?: string | null;
  created_at?: string;
}

export interface TeacherAvailability {
  id: string;
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  note?: string | null;
  created_at?: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  employee?: Employee;
  type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string | null;
  attachment_url?: string | null;
  status: LeaveStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  approval_note?: string | null;
  created_at?: string;
}

export interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: PayrollStatus;
  closed_at?: string | null;
  created_at?: string;
}

export interface PayrollEntry {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  employee?: Employee;
  base_amount: number;
  hours_worked: number;
  classes_taught: number;
  bonus: number;
  deductions: number;
  hourly_rate?: number | null;
  total_amount: number;
  status: PayrollEntryStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmployeeInput {
  user_id: string;
  employee_type: EmployeeType;
  job_title: string;
  department?: string;
  contract_start: string;
  contract_end?: string;
  salary?: number;
  hourly_rate?: number;
}
