import apiClient from "./client";
import type { User } from "@/types";

export interface CreateUserDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  branch_id?: string;
  role_id?: string;
  status?: string;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  branch_id?: string;
  role_id?: string;
  status?: string;
}

export const usersApi = {
  findAll: async (params?: { branchId?: string; roleId?: string; status?: string; search?: string }): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>("/users", { params });
    return data;
  },
  findOne: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },
  create: async (dto: CreateUserDto): Promise<User> => {
    const { data } = await apiClient.post<User>("/users", dto);
    return data;
  },
  update: async (id: string, dto: UpdateUserDto): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, dto);
    return data;
  },
  remove: async (id: string): Promise<unknown> => {
    const { data } = await apiClient.delete(`/users/${id}`);
    return data;
  },
  updateRole: async (id: string, roleId: string): Promise<unknown> => {
    const { data } = await apiClient.patch(`/users/${id}/role`, { role_id: roleId });
    return data;
  },
  resetPassword: async (id: string, newPassword: string): Promise<unknown> => {
    const { data } = await apiClient.post(`/users/${id}/reset-password`, { password: newPassword });
    return data;
  },
  toggleStatus: async (id: string, status: string): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/users/${id}/status`, { status });
    return data;
  },
};
