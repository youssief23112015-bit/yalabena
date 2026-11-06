import apiClient from "./client";
import type { DashboardStats } from "@/types";

/**
 * Dashboard KPIs (GET /dashboard/stats).
 *
 * The five chart endpoints that used to live here (sales-funnel, revenue,
 * teacher-utilization, group-fill-rate, outstanding-payments) duplicated
 * /reports/* — which already exists and is what Reports.tsx calls — so they
 * were removed rather than pointing at dead routes.
 */
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
    return data;
  },
};
