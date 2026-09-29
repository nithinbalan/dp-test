/**
 * Gap Assessment Route Handler — the readiness hub's data. GET reads the
 * current catalog + state (empty / in-progress / completed). POST starts a
 * fresh run — used for both "Start assessment" and "Retake" (`reassess` is
 * the same operation on an already-completed workspace).
 */
import type { NextRequest } from 'next/server';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { getReadiness, startAssessment } from './service';

async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const GET = defineRoute(async ({ request, requestId }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);
  return dataResponse(await getReadiness(ctx));
});

export const POST = defineRoute(async ({ request, requestId }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const result = await startAssessment(ctx);
  if (!result.ok) return errorResponse(result.error, requestId);
  return dataResponse(result.value, { status: 201 });
});
