/**
 * Departments Route Handler — one department. PATCH renames it, DELETE
 * removes it (refused while any live employee still sits in it — see
 * `../service.ts`'s `removeDepartment`). Configuration Studio's Master Data
 * list is the only caller.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { removeDepartment, updateDepartment } from '../service';

const updateSchema = z.object({ name: z.string().min(1).max(120), isActive: z.boolean() });

async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const PATCH = defineRoute<{ id: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const body = await parseJsonBody(request, updateSchema);
  if (!body.ok) return errorResponse(body.error, requestId);

  const { id } = await params;
  const result = await updateDepartment(ctx, id, body.value.name, body.value.isActive);
  if (!result.ok) return errorResponse(result.error, requestId);
  return dataResponse(result.value);
});

export const DELETE = defineRoute<{ id: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const { id } = await params;
  const result = await removeDepartment(ctx, id);
  if (!result.ok) return errorResponse(result.error, requestId);
  return dataResponse(result.value);
});
