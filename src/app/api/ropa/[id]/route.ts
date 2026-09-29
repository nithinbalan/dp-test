/**
 * RoPA Route Handler — one activity. GET reads it, PATCH overwrites it (always
 * reopening it for review — see ../service.ts's header).
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { getActivity, updateActivity } from '../service';

const wizardInputSchema = z.object({
  name: z.string().min(1).max(200),
  purpose: z.string().min(1).max(500),
  principals: z.string().min(1),
  identifiers: z.array(z.string()),
  collectionSource: z.string(),
  storageLocations: z.array(z.string()),
  retention: z.string(),
  lawfulBasis: z.string().min(1),
  processors: z.array(z.string()),
  ownerId: z.string().uuid(),
  crossBorder: z.enum(['india', 's16']),
  operations: z.array(z.string()),
  securityMeasures: z.array(z.string()),
});

async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const GET = defineRoute<{ id: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const { id } = await params;
  const result = await getActivity(ctx, id);
  if (!result.ok) return errorResponse(result.error, requestId);
  return dataResponse(result.value);
});

export const PATCH = defineRoute<{ id: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const body = await parseJsonBody(request, wizardInputSchema);
  if (!body.ok) return errorResponse(body.error, requestId);

  const { id } = await params;
  const result = await updateActivity(ctx, id, body.value);
  if (!result.ok) return errorResponse(result.error, requestId);
  return dataResponse(result.value);
});
