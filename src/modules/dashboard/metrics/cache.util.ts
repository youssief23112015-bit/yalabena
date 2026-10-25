/**
 * Small in-memory TTL cache for dashboard metrics.
 *
 * Keyed by endpoint + scope + period. Entries expire after `ttlMs` (default 60s).
 * Not shared across processes; fine for a single backend instance.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

export class TtlCache<T = unknown> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;

  constructor(ttlMs: number = 60_000) {
    this.ttlMs = ttlMs;
  }

  /** Get a value if present and not expired. */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** Set a value. */
  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /** Delete a key. */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** Remove all expired entries. */
  gc(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  get size(): number {
    return this.store.size;
  }
}

/** Singleton dashboard cache (60s TTL). */
export const dashboardCache = new TtlCache(60_000);

/** Build a cache key from endpoint, scope identifiers and period. */
export function dashboardCacheKey(
  endpoint: string,
  scope: { userId?: string | null; branchId?: string | null; isSuperAdmin?: boolean },
  period: string,
): string {
  return [
    'dashboard',
    endpoint,
    scope.isSuperAdmin ? 'sa' : 'user',
    scope.userId ?? 'anon',
    scope.branchId ?? 'all',
    period,
  ].join(':');
}