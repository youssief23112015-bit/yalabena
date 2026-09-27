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
