import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";

// Match resolution order of src/api/client.ts: VITE_API_URL (absolute) takes priority
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request Interceptor: get token from centralized auth store
// (localStorage first — "Remember Me", then sessionStorage — tab/browser close).
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().getAccessToken();
    console.log(
      "[axios] outgoing",
      config.method?.toUpperCase(),
      config.url,
      token ? `Bearer token present (${token.slice(0, 12)}...)` : "NO TOKEN",
    );
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: clear all auth state on 401 (session expired / invalidated).
api.interceptors.response.use(
  (res) => {
    console.log(
      "[axios] response",
      res.status,
      res.config.method?.toUpperCase(),
      res.config.url,
    );
    return res;
  },
  (error: AxiosError<{ message?: string }>) => {
    console.log(
      "[axios] error",
      error.response?.status ?? "NETWORK_ERROR",
      error.config?.method?.toUpperCase(),
      error.config?.url,
      error.message,
    );
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    const message =
      error.response?.data?.message ??
      error.message ??
      "Something went wrong";

    return Promise.reject(new Error(message));
  },
);

/**
 * Downloads a protected file (resource download / watermarked PDF) using the
 * Bearer token from the centralized auth store.
 */
export async function downloadProtected(path: string, filename?: string) {
  const res = await api.get(path, { responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}