import apiClient from "./client";

/** Exact match to backend: src/modules/placement-tests/placement-tests.controller.ts */
export interface PlacementTest {
  id: string;
  leadId?: string;
  lead_id?: string;
  student_id?: string;
  slot_id?: string;  // أضفنا هذا الحقل هنا
  slot?: any;        // أضفنا هذا الحقل هنا أيضاً لدعم بيانات الـ Slot لو جاءت مع الـ Response
  lead?: any;
  examiner?: any;
  scheduled_date?: string;
  scheduled_at?: string;
  status?: string;
  written_score?: number | null;
  written_max?: number;
  oral_score?: number | null;
  oral_max?: number;
  suggested_level?: string | null;
  final_level?: string | null;
  override_reason?: string | null;
  examiner_notes?: string | null;
  /** @deprecated legacy alias kept for older payloads — backend maps it to final_level */
  assigned_level?: string;
  created_at?: string;
}

export interface EvaluateTestPayload {
  written_score?: number;
  oral_score?: number;
  final_level?: string;
  examiner_notes?: string;
  status?: string;
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
  /** GET /placement-tests/my — the student's own tests (schedule + results). */
  myTests: async (): Promise<PlacementTest[]> => {
    const { data } = await apiClient.get("/placement-tests/my");
    return Array.isArray(data) ? data : (data as any)?.items ?? [];
  },
  /** POST /placement-tests/book — authenticated student books a slot. */
  book: async (dto: { slot_id: string }): Promise<PlacementTest> => {
    const { data } = await apiClient.post("/placement-tests/book", dto);
    return data;
  },
  create: async (dto: Partial<PlacementTest> & { leadId: string; slot_id: string }): Promise<PlacementTest> => {
    const { data } = await apiClient.post<PlacementTest>("/placement-tests", dto);
    return data;
  },
  update: async (id: string, dto: Partial<PlacementTest>): Promise<PlacementTest> => {
    const { data } = await apiClient.put<PlacementTest>(`/placement-tests/${id}`, dto);
    return data;
  },
  /** PATCH /placement-tests/:id/evaluate — record degree + level; backend syncs Lead/Student. */
  evaluate: async (id: string, dto: EvaluateTestPayload): Promise<PlacementTest> => {
    const { data } = await apiClient.patch<PlacementTest>(`/placement-tests/${id}/evaluate`, dto);
    return data;
  },
};