/**
 * Cookie configuration and helpers for session management.
 * Follows OWASP session management guidelines (HttpOnly, Secure, SameSite=Lax).
 *
 * `process.env.NODE_ENV` is read directly rather than via `@shared/config` because
 * this module is imported by `src/middleware.ts`, which may run on the edge runtime
 * where the full env schema (DATABASE_URL, …) is not available. Next.js inlines
 * `NODE_ENV` at build time, so it is safe on every runtime.
 */
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import type { NextRequest } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';

/** Name of the session cookie. Uses __Host- prefix in production with HTTPS. */
export const SESSION_COOKIE_NAME = isProduction ? '__Host-jethur_session' : 'jethur_session';

/** Default session max age in seconds (1 day). */
export const SESSION_MAX_AGE_DEFAULT = 60 * 60 * 24;

/** Extended session max age in seconds when remember-me is selected (30 days). */
export const SESSION_MAX_AGE_REMEMBER = 60 * 60 * 24 * 30;

/** The raw session token carried by a request, if any. Unverified until `validateSession`. */
export function getSessionToken(request: NextRequest): string | undefined {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value;
}

/** Computes secure cookie options for issuing a session cookie. */
export function getSessionCookieOptions(rememberMe = false): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? SESSION_MAX_AGE_REMEMBER : SESSION_MAX_AGE_DEFAULT,
  };
}

/** Computes cookie options for immediately expiring and clearing a session cookie. */
export function getClearSessionCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  };
}
