/**
 * Employees "Import CSV" Route Handler. Accepts a single-file multipart
 * request; parsing and validation are `./service.ts`'s job, not this file's —
 * same split as `settings/workspace/logo/route.ts`.
 */
import type { NextRequest } from 'next/server';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { importEmployeesFromCsv } from './service';

/** 1 MiB comfortably covers the 500-row cap `service.ts` enforces. */
const MAX_CSV_SIZE_BYTES = 1024 * 1024;

async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const POST = defineRoute(async ({ request, requestId }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse('VALIDATION_FAILED', requestId);
  }

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_CSV_SIZE_BYTES) {
    return errorResponse('VALIDATION_FAILED', requestId);
  }

  const csvText = await file.text();
  const result = await importEmployeesFromCsv(ctx, csvText);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }
  return dataResponse(result.value);
});
