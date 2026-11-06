import apiClient from "./client";

/** Exact match to backend: src/modules/waitlists/waitlists.controller.ts */
export interface WaitlistEntry {
  id: string;
  student_id: string;
  student?: any;
  course_id?: string;
  course?: any;
  branch_id?: string;
  branch?: any;
  level?: string;
  status?: string;
  priority?: number;
  notes?: string;
  created_at?: string;
  enrolled_at?: string;
}

export const waitlistsApi = {
  findAll: async (params?: { branch_id?: string; level?: string; status?: string; course_id?: string }): Promise<WaitlistEntry[]> => {
    const { data } = await apiClient.get<WaitlistEntry[]>("/waitlists", { params });
    return Array.isArray(data) ? data : [];
  },
  findOne: async (id: string): Promise<WaitlistEntry> => {
    const { data } = await apiClient.get<WaitlistEntry>(`/waitlists/${id}`);
    return data;
  },
  thresholdReport: async (threshold = 8): Promise<{ threshold: number; ready_to_open: any[] }> => {
    const { data } = await apiClient.get(`/waitlists/threshold-report`, { params: { threshold } });
    return data;
  },
  assignToGroup: async (id: string, group_id: string): Promise<any> => {
    const { data } = await apiClient.post(`/waitlists/${id}/assign`, { group_id });
    return data;
  },
  bulkAssign: async (waitlist_ids: string[], group_id: string): Promise<any> => {
    const { data } = await apiClient.post(`/waitlists/bulk-assign`, { waitlist_ids, group_id });
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/waitlists/${id}`);
  },
};
