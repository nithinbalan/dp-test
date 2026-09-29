/**
 * Workspace switch Route Handler.
 * Sets the workspace a session falls back to when the request host names none, and
 * returns it so the client can navigate to that workspace's host.
 */
import { z } from 'zod';
import { getSessionToken, switchActiveWorkspace, toWorkspaceSummary } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import type { WorkspaceId } from '@shared/types';

const switchSchema = z.object({
  workspaceId: z.string().uuid(),
});

export const POST = defineRoute(async ({ request, requestId }) => {
  const rawToken = getSessionToken(request);
  if (!rawToken) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }

  const body = await parseJsonBody(request, switchSchema);
  if (!body.ok) {
    return errorResponse(body.error, requestId);
  }

  const result = await switchActiveWorkspace(rawToken, body.value.workspaceId as WorkspaceId);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }

  return dataResponse({ workspace: toWorkspaceSummary(result.value) });
});
