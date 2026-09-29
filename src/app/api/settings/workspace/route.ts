/**
 * Workspace settings Route Handler — the Configuration Studio "Workspace" panel.
 * GET reads the current settings; PATCH saves the editable fields.
 *
 * Parses input, calls the service, shapes the response — nothing else. Which sectors
 * are legal, which language is the base one and whether a DPO exists are all decided
 * in `../service.ts`.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { getWorkspaceSettings, saveWorkspaceSettings, WORKSPACE_SECTORS } from '../service';

const saveSchema = z.object({
  legalName: z.string().min(1).max(200),
  sector: z.enum(WORKSPACE_SECTORS),
  languages: z.array(z.string().min(2).max(10)).max(30),
  dpoEmployeeId: z.string().uuid().nullable(),
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
  if (!ctx) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }
  return dataResponse(await getWorkspaceSettings(ctx));
});

export const PATCH = defineRoute(async ({ request, requestId }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }

  const body = await parseJsonBody(request, saveSchema);
  if (!body.ok) {
    return errorResponse(body.error, requestId);
  }

  const result = await saveWorkspaceSettings(ctx, body.value);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }
  return dataResponse(result.value);
});
