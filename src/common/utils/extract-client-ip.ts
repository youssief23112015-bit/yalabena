import { IncomingMessage } from 'http';

/**
 * Extracts the client's true IP address from an HTTP request.
 *
 * When behind a proxy/load balancer, the `x-forwarded-for` header contains a
 * comma-separated chain of IPs: the leftmost is the original client, the rest
 * are intervening proxies. We return only the first entry (the real client),
 * trimmed of whitespace.
 *
 * Falls back to `req.ip` / `req.connection.remoteAddress` when the header is
 * absent or empty. Callers should set `app.set('trust proxy', true)` so that
 * Express populates `req.ip` from `x-forwarded-for` / `x-real-ip`.
 */
export function extractClientIp(req: IncomingMessage & { ip?: string; connection?: { remoteAddress?: string } }): string | null {
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const list = Array.isArray(xff) ? xff : String(xff).split(',');
    const first = list[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    const value = Array.isArray(realIp) ? realIp[0] : String(realIp);
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }

  if (req.ip) return req.ip;
  if (req.connection?.remoteAddress) return req.connection.remoteAddress;

  return null;
}
