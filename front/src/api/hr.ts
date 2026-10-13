import apiClient from "./client";
import type {
  Employee, EmployeeDocument, TeacherAvailability, LeaveRequest,
  PayrollPeriod, PayrollEntry, CreateEmployeeInput,
  EmployeeStatus, EmployeeType, LeaveStatus, LeaveType, DocumentType,
} from "@/types/hr";

export const hrApi = {
  employees: async (params?: { status?: EmployeeStatus; department?: string; type?: EmployeeType }) => {
    const { data } = await apiClient.get<Employee[]>("/hr/employees", { params });
    return data;
  },
  employee: async (id: string) => {
    const { data } = await apiClient.get<Employee>(`/hr/employees/${id}`);
    return data;
  },
  createEmployee: async (input: CreateEmployeeInput) => {
    const { data } = await apiClient.post<Employee>("/hr/employees", input);
    return data;
  },
  updateEmployee: async (id: string, input: Partial<CreateEmployeeInput & {
    department: string; bank_account: string; bank_name: string; status: EmployeeStatus;
    currency: string; employee_number: string;
  }>) => {
    const { data } = await apiClient.patch<Employee>(`/hr/employees/${id}`, input);
    return data;
  },
  terminateEmployee: async (id: string, reason: string, termination_date?: string) => {
    const { data } = await apiClient.patch<Employee>(`/hr/employees/${id}/terminate`, { reason, termination_date });
    return data;
  },
  documents: async (employeeId: string) => {
    const { data } = await apiClient.get<EmployeeDocument[]>(`/hr/employees/${employeeId}/documents`);
    return data;
  },
  addDocument: async (input: {
    employee_id: string; name: string; file_url: string; document_type: DocumentType; expiry_date?: string;
  }) => {
    const { data } = await apiClient.post<EmployeeDocument>("/hr/documents", input);
    return data;
  },
  deleteDocument: async (id: string) => {
    const { data } = await apiClient.delete(`/hr/documents/${id}`);
    return data;
  },
  availability: async (employeeId: string) => {
    const { data } = await apiClient.get<TeacherAvailability[]>(`/hr/employees/${employeeId}/availabilities`);
    return data;
  },
  addAvailability: async (input: {
    employee_id: string; day_of_week: number; start_time: string; end_time: string; is_available?: boolean; note?: string;
  }) => {
    const { data } = await apiClient.post<TeacherAvailability>("/hr/availabilities", input);
    return data;
  },
  updateAvailability: async (id: string, input: Partial<Omit<TeacherAvailability, "id" | "employee_id" | "created_at">>) => {
    const { data } = await apiClient.patch<TeacherAvailability>(`/hr/availabilities/${id}`, input);
    return data;
  },
  deleteAvailability: async (id: string) => {
    const { data } = await apiClient.delete(`/hr/availabilities/${id}`);
    return data;
  },
  leaves: async (params?: { status?: LeaveStatus; employee_id?: string }) => {
    const { data } = await apiClient.get<LeaveRequest[]>("/hr/leaves", { params });
    return data;
  },
  myEmployee: async () => {
    const { data } = await apiClient.get<Employee>("/hr/me");
    return data;
  },
  myLeaves: async () => {
    const { data } = await apiClient.get<LeaveRequest[]>("/hr/my-leaves");
    return data;
  },
  requestLeave: async (input: {
    employee_id: string; type: LeaveType; start_date: string; end_date: string; days_count: number; reason?: string; attachment_url?: string;
  }) => {
    const { data } = await apiClient.post<LeaveRequest>("/hr/leaves", input);
    return data;
  },
  cancelMyLeave: async (id: string) => {
    const { data } = await apiClient.put<LeaveRequest>(`/hr/leaves/${id}/cancel`);
    return data;
  },
  approveLeave: async (id: string, note?: string) => {
    const { data } = await apiClient.put<LeaveRequest>(`/hr/leaves/${id}/approve`, { note });
    return data;
  },
  rejectLeave: async (id: string, note?: string) => {
    const { data } = await apiClient.put<LeaveRequest>(`/hr/leaves/${id}/reject`, { note });
    return data;
  },
  payrollPeriods: async () => {
    const { data } = await apiClient.get<PayrollPeriod[]>("/hr/payroll-periods");
    return data;
  },
  createPayrollPeriod: async (input: { name: string; start_date: string; end_date: string }) => {
    const { data } = await apiClient.post<PayrollPeriod>("/hr/payroll-periods", input);
    return data;
  },
  closePayrollPeriod: async (id: string) => {
    const { data } = await apiClient.patch<PayrollPeriod>(`/hr/payroll-periods/${id}/close`);
    return data;
  },
  calculateTeacherPayroll: async (id: string) => {
    const { data } = await apiClient.post(`/hr/payroll-periods/${id}/calculate-teachers`);
    return data;
  },
  payrollEntries: async (id: string) => {
    const { data } = await apiClient.get<PayrollEntry[]>(`/hr/payroll-periods/${id}/entries`);
    return data;
  },
  createPayrollEntry: async (input: {
    payroll_period_id: string; employee_id: string; hours_worked?: number; classes_taught?: number;
    bonus?: number; deductions?: number; status?: string; notes?: string;
  }) => {
    const { data } = await apiClient.post<PayrollEntry>("/hr/payroll-entries", input);
    return data;
  },
  exportPayroll: async (id: string) => {
    const response = await apiClient.get<string>(`/hr/payroll-periods/${id}/export`, { responseType: "text" });
    return response.data;
  },
};
