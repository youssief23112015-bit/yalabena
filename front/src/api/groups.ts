import apiClient from "./client";
import type { Group, GroupSchedule } from "@/types";

export const groupsApi = {
  findAll: async (params?: { branchId?: string; courseId?: string; status?: string; teacherId?: string }): Promise<Group[]> => {
    const { data } = await apiClient.get<Group[]>("/groups", { params });
    return data;
  },
  findOne: async (id: string): Promise<Group> => {
    const { data } = await apiClient.get<Group>(`/groups/${id}`);
    return data;
  },
  create: async (dto: Partial<Group>): Promise<Group> => {
    const { data } = await apiClient.post<Group>("/groups", dto);
    return data;
  },
  update: async (id: string, dto: Partial<Group>): Promise<Group> => {
    const { data } = await apiClient.put<Group>(`/groups/${id}`, dto);
    return data;
  },
  remove: async (id: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/groups/${id}`);
    return data;
  },
  addSchedule: async (id: string, schedule: Omit<GroupSchedule, 'id' | 'group_id'>): Promise<GroupSchedule> => {
    const { data } = await apiClient.post<GroupSchedule>(`/groups/${id}/schedule`, schedule);
    return data;
  },
  removeSchedule: async (id: string, scheduleId: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/groups/${id}/schedule/${scheduleId}`);
    return data;
  },
  assignStudent: async (id: string, studentId: string): Promise<unknown> => {
    const { data } = await apiClient.post(`/groups/${id}/students`, { student_id: studentId });
    return data;
  },
  removeStudent: async (id: string, studentId: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/groups/${id}/students/${studentId}`);
    return data;
  },
  checkConflicts: async (params: { teacherId?: string; classroomId?: string; start_time?: string; end_time?: string; excludeGroupId?: string }): Promise<{ conflicts: boolean; details: string[] }> => {
    const { data } = await apiClient.get<{ conflicts: boolean; details: string[] }>("/groups/check-conflicts", { params });
    return data;
  },
  getCalendar: async (params: { view: 'day' | 'week' | 'month'; date: string; teacherId?: string; classroomId?: string; branchId?: string }): Promise<Group[]> => {
    const { data } = await apiClient.get<Group[]>("/groups/calendar", { params });
    return data;
  },
};
