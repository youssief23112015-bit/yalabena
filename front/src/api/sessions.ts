import apiClient from "./client";
import type { SessionItem, Attendance } from "@/types";

export const sessionsApi = {
  findAll: async (groupId?: string, params?: { from?: string; to?: string; status?: string }): Promise<SessionItem[]> => {
    const { data } = await apiClient.get<SessionItem[]>("/sessions", {
      params: { groupId, ...params },
    });
    return data;
  },
  findOne: async (id: string): Promise<SessionItem> => {
    const { data } = await apiClient.get<SessionItem>(`/sessions/${id}`);
    return data;
  },
  create: async (dto: Partial<SessionItem>): Promise<SessionItem> => {
    const { data } = await apiClient.post<SessionItem>("/sessions", dto);
    return data;
  },
  update: async (id: string, dto: Partial<SessionItem>): Promise<SessionItem> => {
    const { data } = await apiClient.put<SessionItem>(`/sessions/${id}`, dto);
    return data;
  },
  remove: async (id: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/sessions/${id}`);
    return data;
  },
  cancel: async (id: string, reason: string): Promise<SessionItem> => {
    const { data } = await apiClient.post<SessionItem>(`/sessions/${id}/cancel`, { reason });
    return data;
  },
  getAttendance: async (id: string): Promise<Attendance[]> => {
    const { data } = await apiClient.get<Attendance[]>(`/sessions/${id}/attendance`);
    return data;
  },
  recordAttendance: async (id: string, attendances: Omit<Attendance, 'id' | 'session_id' | 'created_at' | 'updated_at'>[]): Promise<Attendance[]> => {
    const { data } = await apiClient.post<Attendance[]>(`/sessions/${id}/attendance`, { attendances });
    return data;
  },
  updateAttendance: async (id: string, attendanceId: string, status: Attendance['status'], notes?: string): Promise<Attendance> => {
    const { data } = await apiClient.patch<Attendance>(`/sessions/${id}/attendance/${attendanceId}`, { status, notes });
    return data;
  },
  generateQrCode: async (id: string): Promise<{ qr_code: string; check_in_code: string }> => {
    const { data } = await apiClient.post<{ qr_code: string; check_in_code: string }>(`/sessions/${id}/qr-code`);
    return data;
  },
  selfCheckIn: async (id: string, code: string): Promise<Attendance> => {
    const { data } = await apiClient.post<Attendance>(`/sessions/${id}/check-in`, { code });
    return data;
  },
  lockAttendance: async (id: string): Promise<SessionItem> => {
    const { data } = await apiClient.post<SessionItem>(`/sessions/${id}/lock-attendance`);
    return data;
  },
};
