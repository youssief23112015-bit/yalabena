import apiClient from "./client";

/** Exact match to backend: src/modules/placement-tests/placement-tests.controller.ts */
export interface PlacementTest {
  id: string;
  leadId?: string;
  lead_id?: string;
  lead?: any;
  examiner?: any;
  scheduled_date?: string;
  status?: string;
  written_score?: number;
  oral_score?: number;
  assigned_level?: string;
  created_at?: string;
}

export const placementAdminApi = {
  findAll: async (leadId?: string): Promise<PlacementTest[]> => {
    const { data } = await apiClient.get<PlacementTest[]>("/placement-tests", { params: leadId ? { leadId } : {} });
    return Array.isArray(data) ? data : [];
  },
  findOne: async (id: string): Promise<PlacementTest> => {
    const { data } = await apiClient.get<PlacementTest>(`/placement-tests/${id}`);
    return data;
  },
  create: async (dto: Partial<PlacementTest> & { leadId: string }): Promise<PlacementTest> => {
    const { data } = await apiClient.post<PlacementTest>("/placement-tests", dto);
    return data;
  },
  update: async (id: string, dto: Partial<PlacementTest>): Promise<PlacementTest> => {
    const { data } = await apiClient.put<PlacementTest>(`/placement-tests/${id}`, dto);
    return data;
  },
};
