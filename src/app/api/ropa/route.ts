/**
 * RoPA Route Handler — the "RoPA · Processing" register (s.5(1)).
 * GET reads every activity, POST creates a new one.
 *
 * Parses input, calls the service, shapes the response — nothing else. Statutory
 * mapping and the re-approval-on-edit policy are decided in `./service.ts`.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { createActivity, getActivities } from './service';

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
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);
  return dataResponse(await getActivities(ctx));
});

export const POST = defineRoute(async ({ request, requestId }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const body = await parseJsonBody(request, wizardInputSchema);
  if (!body.ok) return errorResponse(body.error, requestId);

  const result = await createActivity(ctx, body.value);
  if (!result.ok) return errorResponse(result.error, requestId);
  return dataResponse(result.value, { status: 201 });
});
