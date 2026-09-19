import api from "./client";
import type { Lead, LeadActivity } from "@/types";

export interface LeadFilters {
  search?: string;
  status?: string;
  source?: string;
  branch_id?: string;
  assigned_to?: string;
}

export interface CreateLeadDto {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  source: string;
  national_id?: string;
  level_interest?: string;
  notes?: string;
  assigned_to?: string;
  branch_id?: string;
  tags?: string[];
  follow_up_date?: string;
}

export interface UpdateLeadDto extends Partial<CreateLeadDto> {
  status?: string;
}

export interface BulkImportResult {
  imported: number;
  errors: string[];
}

const unwrap = <T>(response: any): T => {
  return response?.data?.data ?? response?.data ?? response;
};

const normalizeArray = <T>(response: any): T[] => {
  const value = response?.data?.data ?? response?.data ?? response;

  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.leads)) {
    return value.leads;
  }

  if (Array.isArray(value?.items)) {
    return value.items;
  }

  return [];
};

export const leadsApi = {
  findAll: async (filters?: LeadFilters): Promise<Lead[]> => {
    const response = await api.get("/leads", {
      params: filters,
    });

    return normalizeArray<Lead>(response);
  },

  findOne: async (id: string): Promise<Lead> => {
    const response = await api.get(`/leads/${id}`);
    return unwrap<Lead>(response);
  },

  findById: async (id: string): Promise<Lead> => {
    return leadsApi.findOne(id);
  },

  create: async (data: CreateLeadDto): Promise<Lead> => {
    const response = await api.post("/leads", data);
    return unwrap<Lead>(response);
  },

  update: async (
    id: string,
    data: UpdateLeadDto,
  ): Promise<Lead> => {
    const response = await api.put(`/leads/${id}`, data);
    return unwrap<Lead>(response);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/leads/${id}`);
  },

  delete: async (id: string): Promise<void> => {
    return leadsApi.remove(id);
  },

  getActivities: async (id: string): Promise<LeadActivity[]> => {
    const response = await api.get(`/leads/${id}/activities`);
    return normalizeArray<LeadActivity>(response);
  },

  addActivity: async (
    id: string,
    activity: Omit<LeadActivity, "id" | "lead_id" | "created_at">,
  ): Promise<LeadActivity> => {
    const response = await api.post(
      `/leads/${id}/activities`,
      activity,
    );

    return unwrap<LeadActivity>(response);
  },

  convertToStudent: async (id: string): Promise<any> => {
    const response = await api.post(`/leads/${id}/convert`);
    return unwrap(response);
  },

  bulkImport: async (file: File): Promise<BulkImportResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/leads/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return unwrap<BulkImportResult>(response);
  },

  bulkExport: async (filters?: LeadFilters): Promise<Blob> => {
    const response = await api.get("/leads/export", {
      params: filters,
      responseType: "blob",
    });

    return response.data;
  },
};

