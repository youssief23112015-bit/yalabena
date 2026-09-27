import apiClient from "./client";
import type { PaginatedAuditLogs } from "@/types";

export interface AuditLogQuery {
  module?: string;
  action?: string;
  actor_id?: string;
  target_id?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export const auditApi = {
  list: async (query: AuditLogQuery = {}): Promise<PaginatedAuditLogs> => {
    const { data } = await apiClient.get<PaginatedAuditLogs>("/audit-logs", { params: query });
    return data;
  },
};
