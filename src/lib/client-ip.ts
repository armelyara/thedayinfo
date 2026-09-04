/**
 * Extracts the client IP from a trusted-proxy perspective.
 *
 * On Firebase App Hosting / Cloud Run, the platform APPENDS the real client IP
 * as the last entry of `X-Forwarded-For`. The leftmost entry is attacker-
 * controlled and MUST NOT be used for security decisions (rate limiting),
 * otherwise an attacker rotates it to get a fresh bucket on every request.
 *
 * We therefore read the rightmost hop. If the infra adds N trusted proxies,
 * adjust the index accordingly.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') ?? '';
  const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length > 0) return parts[parts.length - 1];
  return req.headers.get('x-real-ip') || 'unknown';
}
