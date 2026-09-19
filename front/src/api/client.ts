import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "./auth";
import type { ApiResponse, ApiError } from "@/types";

// التعديل: التوجيه المباشر لسيرفر NestJS على المنفذ 3000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

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
      };
      normalizedError.statusCode = status;
      normalizedError.errors = payload?.errors;
      return Promise.reject(normalizedError);
    }

    return Promise.reject(new Error(error.message || "Network error"));
  }
);

export default apiClient;