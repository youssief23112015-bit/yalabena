import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// ✅ Request Interceptor: قراءة الـ Token من كائن speakup-auth
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authData = localStorage.getItem("speakup-auth");

    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const token = parsed?.state?.accessToken;

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to parse auth token from speakup-auth:", error);
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ Response Interceptor: المعالجة والتوجيه عند انتهاء الجلسة (401)
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      // مسح المفتاح الصحيح الخاص بـ Zustand للحالة
      localStorage.removeItem("speakup-auth");
      localStorage.removeItem("lms_token");
      localStorage.removeItem("lms_user");

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
 * Bearer token from speakup-auth via the configured axios instance.
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