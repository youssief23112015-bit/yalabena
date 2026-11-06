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

// ─── Self-Service Interfaces ───

export interface UpdateMyProfileInput {
  job_title?: string;
  department?: string;
  phone?: string;
}

export interface AddMyDocumentInput {
  name?: string;
  file_url?: string;
  document_type?: DocumentType;
  expiry_date?: string;
}

export interface MyPayrollQuery {
  period_id?: string;
}

export interface MyGroup {
  id: string;
  name: string;
  course?: Course;
  teacher?: User;
  schedules?: GroupSchedule[];
  status?: string;
  start_date?: string;
  end_date?: string;
  mode?: string;
  is_teacher: boolean;
}

export interface MyStudent {
  id: string;
  student_number?: string;
  current_level?: string;
  status?: string;
  user?: User;
  enrolled_at?: string;
}

export interface MySession {
  id: string;
  group_id: string;
  date: string;
  start_time?: string;
  end_time?: string;
  mode?: string;
  topic?: string;
  zoom_join_url?: string | null;
  cancelled_at?: string | null;
  attendance_locked?: boolean;
  is_upcoming: boolean;
  is_completed: boolean;
}

export interface MyTeachingHoursPeriod {
  period_id: string;
  period_name?: string;
  hours_worked: number;
  classes_taught: number;
  total_amount: number;
  status: string;
}

export interface MyTeachingHours {
  employee_id: string;
  total_hours: number;
  total_amount: number;
  total_classes: number;
  periods: MyTeachingHoursPeriod[];
}

export interface MyPayrollEntry {
  id: string;
  employee_id: string;
  period_id: string;
  period_name?: string;
  period_start?: string;
  period_end?: string;
  base_amount: number;
  hours_worked: number;
  classes_taught: number;
  bonus: number;
  deductions: number;
  hourly_rate?: number | null;
  total_amount: number;
  status: string;
  notes?: string | null;
}

export interface MyDocument {
  id: string;
  employee_id: string;
  name: string;
  file_url: string;
  document_type: DocumentType;
  expiry_date?: string | null;
  created_at?: string;
}

export interface MyLead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  status: string;
  source?: string;
  level_interest?: string;
  placement_score?: number | null;
  placement_level?: string | null;
  converted_to_student_id?: string;
  converted_at?: string | null;
  assigned_to?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MySalesTarget {
  id: string;
  month: number;
  year: number;
  target_amount: number;
  target_conversions: number;
  achieved_amount: number;
  achieved_conversions: number;
  conversion_rate: number;
  amount_achievement: number;
}

export interface TeacherEvaluation {
  id: string;
  group_id?: string;
  student_id?: string;
  teacher_id?: string;
  term?: string;
  overall_comment?: string | null;
  is_shared_with_student: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicData {
  groups: MyGroup[];
  evaluations: TeacherEvaluation[];
}
