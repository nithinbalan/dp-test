/**
 * Serves a previously uploaded workspace logo's bytes. Not a static asset under
 * `public/` on purpose: the attachment id is looked up inside THIS workspace's
 * own transaction, so a request authenticated for workspace A can never read
 * workspace B's logo even if it guesses the id.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { defineRoute } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { getWorkspaceLogo } from '../service';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const GET = defineRoute<{ attachmentId: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }

  const { attachmentId } = await params;
  if (!UUID_PATTERN.test(attachmentId)) {
    return errorResponse('NOT_FOUND', requestId);
  }

  const result = await getWorkspaceLogo(ctx, attachmentId);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }

  return new NextResponse(new Uint8Array(result.value.bytes), {
    headers: {
      'Content-Type': result.value.mimeType,
      'Cache-Control': 'private, max-age=300',
    },
  });
});
