/**
 * One notice's Route Handler. GET reads its current sections; PATCH saves an edit to
 * the name and/or sections. Publishing is a separate action — see `./publish/route.ts`.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { getNotice, saveNotice } from '../service';

const sectionSchema = z.object({
  key: z.enum(['who', 'collect', 'why', 'how', 'share', 'keep', 'rights', 'contact']),
  heading: z.string().min(1).max(200),
  body: z.string().max(10_000),
});

const saveSchema = z.object({
  name: z.string().min(1).max(200),
  sections: z.array(sectionSchema).min(1),
});

async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const GET = defineRoute<{ id: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }

  const { id } = await params;
  const result = await getNotice(ctx, id);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }
  return dataResponse(result.value);
});

export const PATCH = defineRoute<{ id: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }

  const body = await parseJsonBody(request, saveSchema);
  if (!body.ok) {
    return errorResponse(body.error, requestId);
  }

  const { id } = await params;
  const result = await saveNotice(ctx, id, body.value);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }
  return dataResponse(result.value);
});
