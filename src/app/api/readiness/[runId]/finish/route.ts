/** Gap Assessment Route Handler — finalizes a run: scores it and marks it completed. */
import type { NextRequest } from 'next/server';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { finishAssessment } from '../../service';

async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const POST = defineRoute<{ runId: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const { runId } = await params;
  const result = await finishAssessment(ctx, runId);
  if (!result.ok) return errorResponse(result.error, requestId);
  return dataResponse(result.value);
});
