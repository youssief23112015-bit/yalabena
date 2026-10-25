import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "./auth";
import type { ApiResponse, ApiError } from "@/types";

// FIX: VITE_API_URL (absolute, e.g. http://localhost:3000/api/v1) now takes
// priority over VITE_API_BASE_URL (relative, e.g. /api/v1). The previous
// order checked the relative one first — since it's always truthy when set,
// the absolute fallback below it was never actually reachable, so every
// request through this client resolved against the Vite dev server
// (localhost:5173) instead of the NestJS backend (localhost:3000).
//
// In production, if you deploy behind a reverse proxy that serves both the
// frontend and /api/v1 from the same origin, simply don't set VITE_API_URL
// in that environment's .env — it'll fall through to the relative path as
// before. Setting VITE_API_URL always wins, in any environment.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api/v1";

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>;
    if (payload && typeof payload.success === "boolean") {
      response.data = payload.data;
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const response = error.response;

    if (response?.status === 401 && !originalRequest._retry) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await authApi.refresh(refreshToken);
        const { access_token, refresh_token: new_refresh_token, user } = res;

        useAuthStore.getState().setAuth(user, access_token, new_refresh_token);

        localStorage.setItem("access_token", access_token);
        localStorage.setItem("refresh_token", new_refresh_token);
        localStorage.setItem("user", JSON.stringify(user));

        onTokenRefreshed(access_token);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    if (response) {
      const status = response.status;
      const payload = response.data;

      const message = Array.isArray(payload?.message)
        ? payload.message.join("; ")
        : payload?.message || "An unexpected error occurred";

      const normalizedError = new Error(message) as Error & {
        statusCode?: number;
        errors?: Record<string, string[]>;
        // Scheduling conflicts from the activation/reschedule endpoints:
        // structured lines the Groups page renders verbatim.
        conflicts?: Array<Record<string, unknown>>;
        errorList?: string[];
      };
      normalizedError.statusCode = status;
      normalizedError.errors = payload?.errors;
      // ConflictException/BadRequestException bodies carry `conflicts`
      // (structured) and/or `errors` (string[]) alongside `message` —
      // keep them so the UI can explain exactly what blocked the request.
      const body = payload as unknown as {
        conflicts?: Array<Record<string, unknown>>;
        errors?: unknown;
      } | undefined;
      if (Array.isArray(body?.conflicts)) normalizedError.conflicts = body.conflicts;
      if (Array.isArray(body?.errors)) {
        normalizedError.errorList = (body.errors as unknown[]).map((e) => String(e));
      }
      return Promise.reject(normalizedError);
    }

    return Promise.reject(new Error(error.message || "Network error"));
  }
);

export default apiClient;