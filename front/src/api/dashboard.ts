import apiClient from "./client";
import type { DashboardStats } from "@/types";

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
    return data;
  },
  getSalesFunnel: async (period?: string): Promise<{ stage: string; count: number; value: number }[]> => {
    const { data } = await apiClient.get("/dashboard/sales-funnel", { params: { period } });
    return data;
  },
  getRevenue: async (period: 'daily' | 'monthly' | 'yearly', branchId?: string): Promise<{ period: string; amount: number }[]> => {
    const { data } = await apiClient.get("/dashboard/revenue", { params: { period, branchId } });
    return data;
  },
  getTeacherUtilization: async (): Promise<{ teacher_id: string; teacher_name: string; hours_taught: number; hours_available: number; utilization: number }[]> => {
    const { data } = await apiClient.get("/dashboard/teacher-utilization");
    return data;
  },
  getGroupFillRate: async (): Promise<{ group_id: string; group_name: string; capacity: number; enrolled: number; fill_rate: number }[]> => {
    const { data } = await apiClient.get("/dashboard/group-fill-rate");
    return data;
  },
  getOutstandingPayments: async (): Promise<{ student_id: string; student_name: string; amount: number; due_date: string }[]> => {
    const { data } = await apiClient.get("/dashboard/outstanding-payments");
    return data;
  },
};
