import apiClient from "./client";

/** Exact match to backend: src/modules/enrollments/enrollments.controller.ts */
export const enrollmentsApi = {
  create: async (dto: {
    student_id: string; group_id: string; total_fee?: number;
    discount_amount?: number; promo_code?: string; installments_count?: number; due_days?: number;
  }): Promise<any> => {
    const { data } = await apiClient.post("/enrollments", dto);
    return data;
  },
  findAll: async (params?: { student_id?: string; group_id?: string; status?: string; branch_id?: string }): Promise<any[]> => {
    const { data } = await apiClient.get("/enrollments", { params });
    return Array.isArray(data) ? data : data?.items ?? [];
  },
  findOne: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/enrollments/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: "PENDING" | "ACTIVE" | "COMPLETED" | "DROPPED", reason?: string): Promise<any> => {
    const { data } = await apiClient.patch(`/enrollments/${id}/status`, { status, reason });
    return data;
  },
  drop: async (id: string, reason: string): Promise<any> => {
    const { data } = await apiClient.post(`/enrollments/${id}/drop`, { reason });
    return data;
  },
};
