/**
 * Workspace logo upload Route Handler. POST accepts a single-file multipart
 * request; validation and storage are `./service.ts`'s job, not this file's.
 */
import type { NextRequest } from 'next/server';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { uploadWorkspaceLogo } from './service';

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
  if (!(file instanceof File)) {
    return errorResponse('VALIDATION_FAILED', requestId);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const result = await uploadWorkspaceLogo(ctx, { filename: file.name, bytes });
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }
  return dataResponse(result.value);
});
