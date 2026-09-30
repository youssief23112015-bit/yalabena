import apiClient from "./client";

export interface TestSlot {
  id: string;
  branch_id: string;
  examiner_id: string;
  date: string;
  start_time: string;
  end_time: string;
  mode?: string;
  capacity?: number;
  booked_count?: number;
  status?: string;
  branch?: any;
  examiner?: any;
  created_at?: string;
}

export const testSlotsApi = {
  findAll: async (): Promise<TestSlot[]> => {
    const { data } = await apiClient.get<TestSlot[]>("/test-slots");
    return Array.isArray(data) ? data : [];
  },
  create: async (dto: Partial<TestSlot>): Promise<TestSlot> => {
    const { data } = await apiClient.post<TestSlot>("/test-slots", dto);
    return data;
  },
  update: async (id: string, dto: Partial<TestSlot>): Promise<TestSlot> => {
    const { data } = await apiClient.put<TestSlot>(`/test-slots/${id}`, dto);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/test-slots/${id}`);
  },
};