/** Publishes one notice — see `service.ts`'s `publishNotice` for the version-bump rule. */
import type { NextRequest } from 'next/server';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { publishNotice } from '../../service';

async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const POST = defineRoute<{ id: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }

  const { id } = await params;
  const result = await publishNotice(ctx, id);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }
  return dataResponse(result.value);
});
