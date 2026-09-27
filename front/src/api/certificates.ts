import apiClient from "./client";

/** Exact match to backend: src/modules/certificates/certificates.controller.ts */
export const certificatesApi = {
  createTemplate: async (dto: {
    name: string; course_id?: string; html_template: string;
    placeholders?: Record<string, unknown>; background_url?: string; is_default?: boolean;
  }): Promise<any> => {
    const { data } = await apiClient.post("/certificates/templates", dto);
    return data;
  },
  listTemplates: async (course_id?: string): Promise<any[]> => {
    const { data } = await apiClient.get("/certificates/templates", { params: course_id ? { course_id } : {} });
    return Array.isArray(data) ? data : [];
  },
  updateTemplate: async (id: string, dto: Partial<{ name: string; html_template: string; course_id?: string; background_url?: string; is_default?: boolean }>): Promise<any> => {
    const { data } = await apiClient.post(`/certificates/templates/${id}`, dto);
    return data;
  },
  issue: async (dto: { student_id: string; course_id: string; group_id: string; template_id?: string }): Promise<any> => {
    const { data } = await apiClient.post("/certificates", dto);
    return data;
  },
  autoIssue: async (groupId: string): Promise<any> => {
    const { data } = await apiClient.post(`/certificates/auto-issue/${groupId}`);
    return data;
  },
  revoke: async (id: string, reason: string): Promise<any> => {
    const { data } = await apiClient.post(`/certificates/${id}/revoke`, { reason });
    return data;
  },
  list: async (params?: { student_id?: string; course_id?: string; group_id?: string; status?: string; branch_id?: string }): Promise<any[]> => {
    const { data } = await apiClient.get("/certificates", { params });
    return Array.isArray(data) ? data : data?.items ?? [];
  },
  getOne: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/certificates/${id}`);
    return data;
  },
  pdf: async (id: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/certificates/${id}/pdf`, { responseType: "blob" });
    return data as Blob;
  },
  verify: async (code: string): Promise<any> => {
    const { data } = await apiClient.get(`/certificates/verify/${encodeURIComponent(code)}`);
    return data;
  },
};
