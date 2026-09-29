/**
 * Sign-out Route Handler.
 * Revokes the current session and clears the session cookie.
 */
import { SESSION_COOKIE_NAME, getSessionToken, signOut } from '@server/auth';
import { getClearSessionCookieOptions } from '@server/auth/cookies';
import { dataResponse, defineRoute } from '@server/http';

export const POST = defineRoute(async ({ request }) => {
  const rawToken = getSessionToken(request);
  if (rawToken) {
    await signOut(rawToken);
  }

  const response = dataResponse({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', getClearSessionCookieOptions());
  return response;
});
