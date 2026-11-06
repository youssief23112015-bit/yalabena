import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  /** Max requests allowed within the window. */
  max: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

/**
 * Marks an endpoint as rate-limited to mitigate brute-force / spam attacks.
 *
 * Example:
 *   @RateLimit({ max: 5, windowMs: 60_000 })   // 5 attempts per minute
 */
export function RateLimit(options: RateLimitOptions) {
  return SetMetadata(RATE_LIMIT_KEY, options);
}
