/**
 * Employees Route Handler — the "People & Awareness" page (s.7(i)/s.8(4)).
 * GET reads the roster and its KPIs; POST creates a new employee.
 *
 * Parses input, calls the service, shapes the response — nothing else. Awareness
 * aggregation and code allocation are decided in `./service.ts`.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { createEmployee, getEmployees } from './service';

const createSchema = z.object({
  fullName: z.string().min(1).max(200),
  workEmail: z.string().max(320).optional(),
  department: z.string().max(120).optional(),
  designation: z.string().max(120).optional(),
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
  return dataResponse(await getEmployees(ctx));
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

  const result = await createEmployee(ctx, body.value);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }
  return dataResponse(result.value, { status: 201 });
});
