import apiClient from "./client";

/** Exact match to backend: src/modules/attendance/attendance.controller.ts */
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface MarkOneDto {
  student_id: string;
  status: AttendanceStatus;
  notes?: string;
  minutes_late?: number;
}

export interface RosterResponse {
  session: any;
  students: any[];
  attendances: any[];
}

export interface AttendanceFilter {
  sessionId?: string;
  groupId?: string;
  from?: string;
  to?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student?: {
    id: string;
    student_number: string;
    user?: {
      first_name?: string;
      last_name?: string;
    };
  };
  session?: {
    id: string;
    title?: string;
    topic?: string;
    date?: string;
    group?: {
      id: string;
      name: string;
    };
  };
  status: AttendanceStatus;
  check_in_time?: string;
  check_in_method?: string;
}

export const attendanceApi = {
  getRoster: async (sessionId: string): Promise<RosterResponse> => {
    const { data } = await apiClient.get<RosterResponse>(`/attendances/sessions/${sessionId}/roster`);
    return data;
  },
  markOne: async (sessionId: string, dto: MarkOneDto): Promise<any> => {
    const { data } = await apiClient.post(`/attendances/sessions/${sessionId}/mark`, dto);
    return data;
  },
  bulkMark: async (sessionId: string, records: MarkOneDto[]): Promise<any> => {
    const { data } = await apiClient.post(`/attendances/sessions/${sessionId}/bulk-mark`, { records });
    return data;
  },
  getForSession: async (sessionId: string): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>(`/attendances/sessions/${sessionId}`);
    return data;
  },
  selfCheckIn: async (dto: { session_id: string; code: string; method?: string }): Promise<any> => {
    const { data } = await apiClient.post(`/attendances/check-in`, dto);
    return data;
  },
  getCheckInCode: async (sessionId: string): Promise<{ code: string }> => {
    const { data } = await apiClient.get<{ code: string }>(`/attendances/sessions/${sessionId}/check-in-code`);
    return data;
  },
  /** Student joins a session via Zoom — backend auto-marks attendance as present. */
  joinZoom: async (sessionId: string): Promise<any> => {
    const { data } = await apiClient.post(`/attendances/sessions/${sessionId}/join-zoom`);
    return data;
  },
  /** List attendance records with optional session/date filters (role-scoped server-side). */
  listAttendance: async (filter: AttendanceFilter): Promise<AttendanceRecord[]> => {
    const { data } = await apiClient.get<AttendanceRecord[]>("/attendances", { params: filter });
    return data;
  },
  /** Export filtered attendance records as CSV. */
  exportAttendance: async (filter: AttendanceFilter): Promise<Blob> => {
    const { data } = await apiClient.get("/attendances/export", {
      params: filter,
      responseType: "blob",
    });
    return data;
  },
  studentReport: async (studentId: string, from?: string, to?: string): Promise<any> => {
    const { data } = await apiClient.get(`/attendances/students/${studentId}/report`, { params: { from, to } });
    return data;
  },
  groupReport: async (groupId: string, from?: string, to?: string): Promise<any> => {
    const { data } = await apiClient.get(`/attendances/groups/${groupId}/report`, { params: { from, to } });
    return data;
  },
  absenceAlerts: async (threshold = 3, group_id?: string): Promise<{ threshold: number; flagged: { student_id: string; absences: number }[] }> => {
    const { data } = await apiClient.get(`/attendances/alerts/absences`, { params: { threshold, group_id } });
    return data;
  },
};
