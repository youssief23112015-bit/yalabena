import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

/** Fields that must never appear in the audit trail. */
const SENSITIVE_KEYS = new Set([
  'password', 'password_hash', 'old_password', 'new_password', 'confirm_password',
  'token', 'access_token', 'refresh_token', 'temp_token', 'secret',
  'two_factor_secret', 'code', 'authorization',
]);

function sanitize(value: any, depth = 0): any {
  if (value === null || value === undefined || depth > 4) return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => sanitize(v, depth + 1));
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : sanitize(v, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string' && value.length > 500) return value.slice(0, 500) + '…';
  return value;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Global audit interceptor (SRS 7.2): every authenticated mutating request
 * (POST/PUT/PATCH/DELETE) is recorded in audit_logs with actor, route,
 * sanitized body, status code, IP and user agent.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const path: string = req.route?.path ?? req.originalUrl ?? '';
    const segments = path.replace(/^\/+/, '').split('/');
    const module = segments[0] || 'unknown';

    const params = req.params ?? {};
    const targetId =
      Object.values(params).find((v) => typeof v === 'string' && UUID_RE.test(v)) ?? null;

    const user = req.user;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const res = context.switchToHttp().getResponse();
          this.audit.log({
            actor_id: user?.userId ?? user?.id ?? null,
            action: `${method} ${path}`,
            module,
            target_type: 'http_request',
            target_id: targetId as string | null,
            after_state: {
              body: sanitize(req.body),
              status: res?.statusCode,
              duration_ms: Date.now() - startedAt,
            },
            ip_address: req.ip,
            user_agent: req.headers?.['user-agent'],
          });
        },
        error: (err) => {
          this.audit.log({
            actor_id: user?.userId ?? user?.id ?? null,
            action: `${method} ${path} (FAILED)`,
            module,
            target_type: 'http_request',
            target_id: targetId as string | null,
            after_state: {
              body: sanitize(req.body),
              error: err?.message,
              duration_ms: Date.now() - startedAt,
            },
            ip_address: req.ip,
            user_agent: req.headers?.['user-agent'],
          });
        },
      }),
    );
  }
}
