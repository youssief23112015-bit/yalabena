import apiClient from "./client";
import type { Branch, Classroom } from "@/types";

export interface CreateBranchDto {
  name: string;
  address: string;
  phone: string;
  email?: string;
  manager_id?: string;
  status?: string;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_id?: string;
  status?: string;
}

export const branchesApi = {
  findAll: async (): Promise<Branch[]> => {
    const { data } = await apiClient.get<Branch[]>("/branches");
    return data;
  },
  findOne: async (id: string): Promise<Branch> => {
    const { data } = await apiClient.get<Branch>(`/branches/${id}`);
    return data;
  },
  create: async (dto: CreateBranchDto): Promise<Branch> => {
    const { data } = await apiClient.post<Branch>("/branches", dto);
    return data;
  },
  update: async (id: string, dto: UpdateBranchDto): Promise<Branch> => {
    const { data } = await apiClient.put<Branch>(`/branches/${id}`, dto);
    return data;
  },
  remove: async (id: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/branches/${id}`);
    return data;
  },
  getClassrooms: async (id: string): Promise<Classroom[]> => {
    const { data } = await apiClient.get<Classroom[]>(`/branches/${id}/classrooms`);
    return data;
  },
  createClassroom: async (id: string, dto: { name: string; capacity: number }): Promise<Classroom> => {
    const { data } = await apiClient.post<Classroom>(`/branches/${id}/classrooms`, dto);
    return data;
  },
  updateClassroom: async (branchId: string, classroomId: string, dto: { name?: string; capacity?: number; status?: string }): Promise<Classroom> => {
    const { data } = await apiClient.put<Classroom>(`/branches/${branchId}/classrooms/${classroomId}`, dto);
    return data;
  },
  removeClassroom: async (branchId: string, classroomId: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/branches/${branchId}/classrooms/${classroomId}`);
    return data;
  },
};