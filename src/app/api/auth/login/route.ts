/**
 * Sign-in Route Handler.
 * Authenticates user credentials against the platform registry and pins to a workspace.
 */
import { z } from 'zod';
import { SESSION_COOKIE_NAME, signInWithPassword, toWorkspaceSummary } from '@server/auth';
import { getSessionCookieOptions } from '@server/auth/cookies';
import { getClientIp } from '@server/auth/ip';
import { checkRateLimit } from '@server/auth/rate-limit';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';

const signInSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
  workspaceSlug: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

/**
 * The workspace slug the user typed wins when present; a blank, untouched field
 * falls back to the subdomain the login page was reached on, if any.
 */
function resolveRequestedWorkspaceSlug(
  bodySlug: string | undefined,
  host: string | null,
): string | undefined {
  const trimmed = bodySlug?.trim();
  if (trimmed) {
    return trimmed;
  }
  return resolveWorkspaceSlugFromHost(host) ?? undefined;
}

// Unauthenticated endpoint with no other throttle in front of it: bound both by
// source (credential stuffing across many accounts) and by target identifier
// (brute force on one account). See docs/SECURITY_HYGIENE.md §5.
const IP_LIMIT = 30;
const IDENTIFIER_LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

export const POST = defineRoute(async ({ request, requestId }) => {
  const ip = getClientIp(request);
  if (ip && !checkRateLimit(`login:ip:${ip}`, IP_LIMIT, WINDOW_MS)) {
    return errorResponse('RATE_LIMITED', requestId);
  }

  const body = await parseJsonBody(request, signInSchema);
  if (!body.ok) {
    return errorResponse(body.error, requestId);
  }

  const identifierKey = body.value.identifier.trim().toLowerCase();
  if (!checkRateLimit(`login:identifier:${identifierKey}`, IDENTIFIER_LIMIT, WINDOW_MS)) {
    return errorResponse('RATE_LIMITED', requestId);
  }

  const result = await signInWithPassword({
    identifier: body.value.identifier,
    password: body.value.password,
    workspaceSlug: resolveRequestedWorkspaceSlug(
      body.value.workspaceSlug,
      request.headers.get('host'),
    ),
    rememberMe: body.value.rememberMe,
    ip,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }

  const { rawToken, user, workspace, availableWorkspaces } = result.value;
  const response = dataResponse({
    user,
    workspace: toWorkspaceSummary(workspace),
    availableWorkspaces,
  });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    rawToken,
    getSessionCookieOptions(body.value.rememberMe),
  );
  return response;
});
