import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, type RateLimitOptions } from '../decorators/rate-limit.decorator';

/**
 * In-memory rate-limit guard.
 *
 * Enforces the limit declared by the @RateLimit() decorator on a per-IP +
 * per-endpoint basis. Endpoints without the decorator are untouched.
 *
 * Notes:
 * - The store is in-memory, so limits are per backend instance. For a
 *   multi-instance deployment, back this with Redis (ioredis is already a
 *   dependency) instead of this Map.
 * - Old entries outside the window are pruned on every hit so the map does
 *   not grow unboundedly.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RateLimitOptions | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const ip = (request.ip ?? request.connection?.remoteAddress ?? 'unknown') as string;
    const route = request.route?.path ?? request.url ?? '';
    const key = `${ip}:${route}`;

    const now = Date.now();
    const windowStart = now - options.windowMs;

    const hits = (this.hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

    if (hits.length >= options.max) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    hits.push(now);
    this.hits.set(key, hits);
    return true;
  }
}
