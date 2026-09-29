/**
 * Session verification Route Handler.
 * Returns the current authenticated user and workspace context.
 */
import { getSessionToken, toWorkspaceSummary, validateSession } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';

export const GET = defineRoute(async ({ request, requestId }) => {
  const rawToken = getSessionToken(request);
  if (!rawToken) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }

  // API routes sit outside the middleware matcher (src/middleware.ts), so the
  // host-resolved slug is derived here directly rather than read from a header
  // middleware never forwards to this route.
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  const result = await validateSession(rawToken, workspaceSlug);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }

  const { user, activeWorkspace, availableWorkspaces } = result.value;
  return dataResponse({
    user,
    workspace: toWorkspaceSummary(activeWorkspace),
    availableWorkspaces,
  });
});
