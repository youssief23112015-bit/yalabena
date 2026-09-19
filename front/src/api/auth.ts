import apiClient from "./client";
import type { AuthResponse, LoginDto, RegisterDto } from "@/types";

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", dto);
    return data;
  },

  register: async (dto: RegisterDto): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/register", dto);
    return data;
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return data;
  },
};
