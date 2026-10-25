import apiClient from "./client";
import type { Course } from "@/types";

export const coursesApi = {
  findAll: async (): Promise<Course[]> => {
    const { data } = await apiClient.get<Course[]>("/courses");
    return data;
  },
  findOne: async (id: string): Promise<Course> => {
    const { data } = await apiClient.get<Course>(`/courses/${id}`);
    return data;
  },
  create: async (dto: Partial<Course>): Promise<Course> => {
    const { data } = await apiClient.post<Course>("/courses", dto);
    return data;
  },
  update: async (id: string, dto: Partial<Course>): Promise<Course> => {
    const { data } = await apiClient.put<Course>(`/courses/${id}`, dto);
    return data;
  },
  remove: async (id: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/courses/${id}`);
    return data;
  },
  addPrerequisite: async (id: string, prerequisiteId: string): Promise<Course> => {
    const { data } = await apiClient.post<Course>(`/courses/${id}/prerequisites`, { prerequisiteId });
    return data;
  },
  removePrerequisite: async (id: string, prerequisiteId: string): Promise<Course> => {
    const { data } = await apiClient.delete<Course>(`/courses/${id}/prerequisites/${prerequisiteId}`);
    return data;
  },
  getMaterials: async (id: string): Promise<Course['materials']> => {
    const { data } = await apiClient.get(`/courses/${id}/materials`);
    return data;
  },
  addMaterial: async (id: string, inventoryItemId: string, quantity: number, required: boolean): Promise<unknown> => {
    const { data } = await apiClient.post(`/courses/${id}/materials`, { inventory_item_id: inventoryItemId, quantity, required });
    return data;
  },
  removeMaterial: async (id: string, materialId: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/courses/${id}/materials/${materialId}`);
    return data;
  },
  getBranchPricing: async (id: string): Promise<Course['branch_pricing']> => {
    const { data } = await apiClient.get(`/courses/${id}/branch-pricing`);
    return data;
  },
  setBranchPricing: async (id: string, branchId: string, price: number): Promise<unknown> => {
    const { data } = await apiClient.post(`/courses/${id}/branch-pricing`, { branch_id: branchId, price });
    return data;
  },
};
