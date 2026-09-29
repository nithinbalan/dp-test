/**
 * Gap Assessment Sections Route Handler. POST adds a new section (domain) to
 * the workspace's questionnaire — Configuration Studio's "Readiness sections"
 * panel is the only caller. Parses input, calls the service, shapes the
 * response — nothing else.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { createDomain, getDomainsForSettings } from '../service';

const createSchema = z.object({ name: z.string().min(1).max(120) });

/**
 * API routes sit outside the middleware matcher (src/middleware.ts), so the
 * host-resolved slug is derived here rather than read from a header middleware never
 * forwards. It is enforced by `validateSession`, not merely recorded.
 */
async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const GET = defineRoute(async ({ request, requestId }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }
  return dataResponse(await getDomainsForSettings(ctx));
});

export const POST = defineRoute(async ({ request, requestId }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }

  const body = await parseJsonBody(request, createSchema);
  if (!body.ok) {
    return errorResponse(body.error, requestId);
  }

  const result = await createDomain(ctx, body.value.name);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }
  return dataResponse(result.value, { status: 201 });
});
