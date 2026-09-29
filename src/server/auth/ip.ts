/**
 * Client IP extraction for rate limiting and session audit fields.
 * Not an identity signal — headers are attacker-controlled — only a coarse
 * throttling key. See docs/SECURITY_HYGIENE.md §5.
 */
import type { NextRequest } from 'next/server';
import { env } from '@shared/config';

/**
 * Best-effort client IP from `X-Forwarded-For`. Returns `undefined` if none is present.
 *
 * Each proxy appends the address it received the request from, so the only entries
 * that can be trusted are the last `TRUSTED_PROXY_HOPS` — anything earlier was
 * written by whoever the outermost trusted proxy talked to, i.e. the client. Reading
 * the FIRST entry, as is common, lets a client choose its own rate-limit key by
 * sending the header itself. With zero trusted hops no header is believed at all.
 */
export function getClientIp(request: NextRequest): string | undefined {
  const hops = env.TRUSTED_PROXY_HOPS;
  if (hops === 0) return undefined;

  const forwarded = request.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!forwarded || forwarded.length < hops) return undefined;

  return forwarded[forwarded.length - hops];
}
