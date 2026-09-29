/**
 * Gap Assessment Route Handler — one run in progress. PATCH saves a profile
 * patch and/or a single question's answer, autosave-style — the wizard calls
 * this on every change, never batching.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import { updateRun } from '../service';

// The wizard always sends the whole profile snapshot on a profile change
// (never a sparse patch), so every field is required here — that sidesteps
// exactOptionalPropertyTypes friction between a partial zod shape and
// `Partial<AssessmentProfile>` entirely.
const profileSchema = z.object({
  entity: z.string(),
  assessorEmployeeId: z.string().uuid().nullable(),
  sector: z.string(),
  recordsHeld: z.string(),
  kids: z.enum(['yes', 'no', 'unsure']).nullable(),
  proc: z.enum(['yes', 'no', 'unsure']).nullable(),
  xbt: z.enum(['yes', 'no', 'unsure']).nullable(),
  sens: z.enum(['yes', 'no', 'unsure']).nullable(),
});

const answerSchema = z.object({
  questionId: z.string().uuid(),
  value: z.enum(['y', 'n', 'p', 'u']),
  note: z.string().max(2000).nullable().optional(),
});

const updateRunSchema = z.union([
  z.object({ profile: profileSchema }),
  z.object({ answer: answerSchema }),
]);

async function requireWorkspaceContext(request: NextRequest) {
  const rawToken = getSessionToken(request);
  if (!rawToken) return null;
  const workspaceSlug = resolveWorkspaceSlugFromHost(request.headers.get('host')) ?? undefined;
  return resolveWorkspaceContext(rawToken, workspaceSlug);
}

export const PATCH = defineRoute<{ runId: string }>(async ({ request, requestId, params }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) return errorResponse('UNAUTHENTICATED', requestId);

  const body = await parseJsonBody(request, updateRunSchema);
  if (!body.ok) return errorResponse(body.error, requestId);

  const { runId } = await params;
  const input: Parameters<typeof updateRun>[2] =
    'profile' in body.value ? { profile: body.value.profile } : { answer: body.value.answer };
  const result = await updateRun(ctx, runId, input);
  if (!result.ok) return errorResponse(result.error, requestId);
  return dataResponse(result.value);
});
