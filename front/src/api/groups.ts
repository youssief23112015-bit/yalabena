import apiClient from "./client";
import type { Group, GroupSchedule } from "@/types";

export const groupsApi = {
  findAll: async (params?: { courseId?: string; status?: string; teacherId?: string }): Promise<Group[]> => {
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
  /** Direct enrollment: ACTIVE enrollment + roster row (force bypasses capacity). */
  assignStudent: async (
    id: string,
    payload:
      | string
      | { student_id: string; course_id?: string; force?: boolean },
  ): Promise<any> => {
    const body = typeof payload === "string" ? { student_id: payload } : payload;
    const { data } = await apiClient.post(`/groups/${id}/students`, body);
    return data;
  },
  /** Direct teacher assignment: 409 on conflicts unless force=true. */
  assignTeacher: async (
    id: string,
    payload: { teacher_id: string; force?: boolean },
  ): Promise<any> => {
    const { data } = await apiClient.patch(`/groups/${id}/assign-teacher`, payload);
    return data;
  },
  removeStudent: async (id: string, studentId: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/groups/${id}/students/${studentId}`);
    return data;
  },
  checkConflicts: async (params: {
    teacherId?: string;
    classroomId?: string;
    /** Weekday 0=Sun..6=Sat — enables time-overlap checks. */
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
    excludeGroupId?: string;
  }): Promise<{ conflicts: boolean; details: string[] }> => {
    const { data } = await apiClient.get<{ conflicts: boolean; details: string[] }>("/groups/check-conflicts", { params });
    return data;
  },
  getCalendar: async (params: { view: 'day' | 'week' | 'month'; date: string; teacherId?: string; classroomId?: string }): Promise<Group[]> => {
    const { data } = await apiClient.get<Group[]>("/groups/calendar", { params });
    return data;
  },
};
