/**
 * Gap Assessment Question Route Handler — one question. PATCH updates it,
 * DELETE removes it (refused once any run has answered it — see
 * `../../../../master-data.service.ts`'s `removeQuestion`). Configuration
 * Studio's Master Data list is the only caller.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { removeQuestion, updateQuestionDetails } from '../../../../service';

const updateSchema = z.object({
  prompt: z.string().min(1).max(500),
  weight: z.number().int().min(1).max(3),
  sectionRef: z.string().max(40).optional(),
  remedy: z.string().max(2000).optional(),
});

async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const PATCH = defineRoute<{ questionId: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const body = await parseJsonBody(request, updateSchema);
  if (!body.ok) return errorResponse(body.error, requestId);

  const { questionId } = await params;
  const result = await updateQuestionDetails(ctx, questionId, body.value);
  if (!result.ok) return errorResponse(result.error, requestId);
  return dataResponse(result.value);
});

export const DELETE = defineRoute<{ questionId: string }>(
  async ({ request, requestId, params }) => {
    const ctx = await requireWorkspaceContext(request);
    if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

    const { questionId } = await params;
    const result = await removeQuestion(ctx, questionId);
    if (!result.ok) return errorResponse(result.error, requestId);
    return dataResponse(result.value);
  },
);
