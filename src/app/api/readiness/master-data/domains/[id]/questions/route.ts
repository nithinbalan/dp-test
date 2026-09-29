/**
 * Gap Assessment Section Questions Route Handler. GET lists a section's
 * questions; POST adds one. Configuration Studio's Master Data list is the
 * only caller.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { createQuestion, getQuestionsForDomain } from '../../../service';

const createSchema = z.object({
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

export const GET = defineRoute<{ id: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const { id } = await params;
  return dataResponse(await getQuestionsForDomain(ctx, id));
});

export const POST = defineRoute<{ id: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const body = await parseJsonBody(request, createSchema);
  if (!body.ok) return errorResponse(body.error, requestId);

  const { id } = await params;
  const result = await createQuestion(ctx, { domainId: id, ...body.value });
  if (!result.ok) return errorResponse(result.error, requestId);
  return dataResponse(result.value, { status: 201 });
});
