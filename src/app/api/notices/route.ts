/**
 * Notices Route Handler — the Notice Manager register (s.5 · Rule 3).
 * GET reads the register and its KPIs; POST drafts a new notice, from either an
 * approved RoPA activity or a free-text description.
 *
 * Parses input, calls the service, shapes the response — nothing else. Section
 * generation and version handling are decided in `./service.ts`.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { createNoticeFromActivity, createNoticeFromScratch, getNotices } from './service';

const createSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('ropa'), name: z.string().min(1).max(200), activityId: z.string() }),
  z.object({
    source: z.literal('scratch'),
    name: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
  }),
]);

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
  return dataResponse(await getNotices(ctx));
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

  const result =
    body.value.source === 'ropa'
      ? await createNoticeFromActivity(ctx, {
          name: body.value.name,
          activityId: body.value.activityId,
        })
      : await createNoticeFromScratch(ctx, {
          name: body.value.name,
          description: body.value.description,
        });
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }
  return dataResponse(result.value, { status: 201 });
});
