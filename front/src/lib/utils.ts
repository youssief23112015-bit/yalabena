import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize any API payload into a guaranteed, render-safe array.
 *
 * The backend wraps every response as { success, data } (TransformInterceptor)
 * and paginated endpoints may use { items } / { results } envelopes. Axios
 * instances without an unwrap interceptor (e.g. @/lib/axios) hand that raw
 * envelope to consumers — calling .map() on it throws
 * "TypeError: .map is not a function" and whitescreens the page.
 *
 * This unwraps those shapes (bounded to avoid cycles), drops non-object
 * entries so a malformed item can never crash the render, and ALWAYS
 * returns an array — never throws.
 */
export function toSafeArray<T = unknown>(value: unknown, depth = 3): T[] {
  if (Array.isArray(value)) {
    return (value as unknown[]).filter(
      (item) => !!item && typeof item === "object",
    ) as T[];
  }
  if (depth > 0 && value && typeof value === "object") {
    const envelope = value as Record<string, unknown>;
    for (const key of ["data", "items", "results"]) {
      if (key in envelope) return toSafeArray<T>(envelope[key], depth - 1);
    }
  }
  return [];
}
