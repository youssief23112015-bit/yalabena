/**
 * Many NestJS boilerplates (this one included, it looks like) wrap every
 * JSON response in a global interceptor as { success, statusCode, message,
 * data }. The rest of this app goes through src/api/client.ts (axios),
 * which unwraps that automatically. The chat module's components use plain
 * fetch() and were missing that step — this is why `rooms.map is not a
 * function` fired: `rooms` was actually `{ success, data: [...] }`.
 *
 * The check for `success` specifically (not just "does it have a `data`
 * key") matters: some of our own payloads legitimately have a top-level
 * `data` field (e.g. { data: messages, total }), and a blind unwrap would
 * silently corrupt those instead of fixing them.
 */
export function unwrapApiResponse<T>(json: unknown): T {
  if (
    json &&
    typeof json === 'object' &&
    'success' in (json as Record<string, unknown>) &&
    'data' in (json as Record<string, unknown>)
  ) {
    return (json as { data: T }).data;
  }
  return json as T;
}

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch {
      // response wasn't JSON (or was empty) — keep the generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;

  const json = await res.json();
  return unwrapApiResponse<T>(json);
}
