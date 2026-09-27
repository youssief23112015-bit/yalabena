import apiClient from "./client";
import type { AuthResponse, LoginDto, RegisterDto, TwoFactorChallenge, TwoFactorSetup } from "@/types";

export type LoginResult = AuthResponse | TwoFactorChallenge;

export function isTwoFactorChallenge(res: LoginResult): res is TwoFactorChallenge {
  return (res as TwoFactorChallenge).requires_2fa === true;
}

export const authApi = {
  login: async (dto: LoginDto): Promise<LoginResult> => {
    const { data } = await apiClient.post<LoginResult>("/auth/login", dto);
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

  /** Complete a 2FA-gated login with the 6-digit TOTP code. */
  verify2fa: async (tempToken: string, code: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/auth/2fa/verify", {
      temp_token: tempToken,
      code,
    });
    return data;
  },

  /** Generate a pending TOTP secret + QR code for enrollment. */
  setup2fa: async (): Promise<TwoFactorSetup> => {
    const { data } = await apiClient.post<TwoFactorSetup>("/auth/2fa/setup");
    return data;
  },

  enable2fa: async (code: string): Promise<{ enabled: boolean }> => {
    const { data } = await apiClient.post<{ enabled: boolean }>("/auth/2fa/enable", { code });
    return data;
  },

  disable2fa: async (code: string): Promise<{ disabled: boolean }> => {
    const { data } = await apiClient.post<{ disabled: boolean }>("/auth/2fa/disable", { code });
    return data;
  },
};
