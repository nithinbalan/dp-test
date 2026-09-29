/**
 * Access control Route Handler — the Configuration Studio "Access control" panel.
 * GET reads the module/permission catalog and every role, resolved to a display
 * level. POST applies one of four mutations. Parses input, calls the service,
 * shapes the response — nothing else; which actions a level grants and whether
 * a role is locked are decided in `../access-control-service.ts`.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSessionToken, resolveWorkspaceContext } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';
import { resolveWorkspaceSlugFromHost } from '@server/workspace/context';
import {
  createRole,
  deleteRole,
  duplicateRole,
  getAccessControl,
  renameRole,
  setAllPermissions,
  setRolePermission,
} from '../access-control-service';

const PERMISSION_LEVELS = ['none', 'view', 'edit', 'approve'] as const;

const mutationSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('createRole'),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    startFromRoleId: z.string().uuid().optional(),
  }),
  z.object({
    kind: z.literal('duplicateRole'),
    roleId: z.string().uuid(),
    name: z.string().min(1).max(100),
  }),
  z.object({
    kind: z.literal('renameRole'),
    roleId: z.string().uuid(),
    name: z.string().min(1).max(100),
  }),
  z.object({
    kind: z.literal('setPermission'),
    roleId: z.string().uuid(),
    moduleKey: z.string().min(1).max(60),
    level: z.enum(PERMISSION_LEVELS),
  }),
  z.object({
    kind: z.literal('setAllPermissions'),
    roleId: z.string().uuid(),
    level: z.enum(PERMISSION_LEVELS),
  }),
  z.object({
    kind: z.literal('deleteRole'),
    roleId: z.string().uuid(),
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
  return dataResponse(await getAccessControl(ctx));
});

export const POST = defineRoute(async ({ request, requestId }) => {
  const ctx = await requireWorkspaceContext(request);
  if (!ctx) {
    return errorResponse('UNAUTHENTICATED', requestId);
  }

  const body = await parseJsonBody(request, mutationSchema);
  if (!body.ok) {
    return errorResponse(body.error, requestId);
  }

  const input = body.value;
  const result = await (() => {
    switch (input.kind) {
      case 'createRole':
        return createRole(ctx, {
          name: input.name,
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.startFromRoleId !== undefined
            ? { startFromRoleId: input.startFromRoleId }
            : {}),
        });
      case 'duplicateRole':
        return duplicateRole(ctx, input.roleId, input.name);
      case 'renameRole':
        return renameRole(ctx, input.roleId, input.name);
      case 'setPermission':
        return setRolePermission(ctx, input.roleId, input.moduleKey, input.level);
      case 'setAllPermissions':
        return setAllPermissions(ctx, input.roleId, input.level);
      case 'deleteRole':
        return deleteRole(ctx, input.roleId);
    }
  })();

  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }
  return dataResponse(result.value);
});
