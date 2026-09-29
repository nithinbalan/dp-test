/**
 * Resolves the authenticated WorkspaceContext from an active session token.
 *
 * This is the ONLY legitimate producer of WorkspaceContext in the system, which is
 * why it lives in `src/server/auth` (infrastructure every module shares) and not in
 * a feature module. See docs/WORKSPACE_ISOLATION.md §4 and ADR-0008.
 */
import { AppError } from '@server/errors';
import type { WorkspaceContext } from '@server/workspace/context';
import { validateSession } from './service';

/**
 * Validates the session token and mints the unforgeable WorkspaceContext
 * required for tenant-scoped database access.
 *
 * `requestedWorkspaceSlug` should be the host-resolved slug for this request —
 * middleware's `x-workspace-slug` header for page routes, or
 * `resolveWorkspaceSlugFromHost(request.headers.get('host'))` in a Route Handler —
 * it is enforced by `validateSession`, not just recorded. See
 * docs/WORKSPACE_ISOLATION.md §3.
 */
export async function resolveWorkspaceContext(
  rawSessionToken: string,
  requestedWorkspaceSlug?: string,
): Promise<WorkspaceContext> {
  const result = await validateSession(rawSessionToken, requestedWorkspaceSlug);
  if (!result.ok) {
    throw new AppError({
      code: result.error,
      message: 'Failed to resolve workspace context from session',
    });
  }

  const { user, activeWorkspace } = result.value;

  return {
    workspaceId: activeWorkspace.id,
    schema: activeWorkspace.schemaName,
    actorId: user.id,
    role: activeWorkspace.role,
  };
}
