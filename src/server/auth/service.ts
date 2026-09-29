/**
 * Core Authentication Service: sign-in, session validation, workspace selection,
 * sign-out. Password recovery lives in ./password-recovery.ts.
 *
 * Which workspace a request is in has ONE source of truth: the request host
 * (docs/WORKSPACE_ISOLATION.md §3). The session row's `workspace_id` is only a
 * fallback for hosts that name no workspace (the shared login host), set at sign-in
 * and by `switchActiveWorkspace`. Validation never rewrites it: a read must not
 * change what a later request on another host resolves to.
 *
 * See docs/WORKSPACE_ISOLATION.md and docs/SECURITY_HYGIENE.md.
 */
import type { ErrorCode } from '@server/errors/codes';
import { err, ok, type Result } from '@shared/lib/result';
import type { WorkspaceId } from '@shared/types';
import { generateSecureToken, hashSha256, verifyPassword } from './crypto';
import * as authRepository from './repository';
import type { SessionLookup, WorkspaceMembershipRow } from './repository';
import type {
  SessionValidationSuccess,
  SignInInput,
  SignInSuccess,
  WorkspaceInfo,
  WorkspaceSummary,
} from './types';

/** Dummy argon2 hash for timing-attack mitigation when an email does not exist. */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRmb3JkdW1teQ$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

/** `last_used_at` is written at most this often per session — it is audit data, not a hot path. */
const LAST_USED_WRITE_INTERVAL_MS = 5 * 60 * 1000;

/** Workspace lifecycle states a member may sign into. Suspended/closing/closed are not. */
const USABLE_WORKSPACE_STATUSES = new Set<WorkspaceMembershipRow['status']>(['active', 'trial']);

/**
 * Which of a user's active memberships resolve to a usable workspace.
 * A membership can be active while its workspace is suspended/closing — that
 * workspace-lifecycle allowlist is a business rule, so it lives here, not in
 * the repository query. See docs/ARCHITECTURE.md "Layering (server)".
 */
export function usableWorkspaces(memberships: WorkspaceMembershipRow[]): WorkspaceMembershipRow[] {
  return memberships.filter((m) => USABLE_WORKSPACE_STATUSES.has(m.status));
}

/**
 * Picks which of the user's usable workspaces a request resolves to.
 *
 * `requestedWorkspaceSlug` is the workspace named by the request host. When present
 * it is authoritative: the caller is browsing that workspace's host, so the session
 * must either hold a membership in exactly that workspace or be denied. It never
 * falls back to the session's stored workspace, which would silently serve
 * workspace A's data on workspace B's subdomain. With no slug (a shared login host,
 * or a non-subdomain resolution strategy) the session's stored workspace wins, then
 * the first usable membership for a session that has none stored.
 */
export function selectSessionWorkspace(
  activeWorkspaces: WorkspaceMembershipRow[],
  storedWorkspaceId: WorkspaceId | null,
  requestedWorkspaceSlug?: string,
): WorkspaceMembershipRow | null {
  if (requestedWorkspaceSlug) {
    const trimmed = requestedWorkspaceSlug.trim().toLowerCase();
    return activeWorkspaces.find((w) => w.slug.toLowerCase() === trimmed) ?? null;
  }

  return (
    activeWorkspaces.find((w) => w.workspaceId === storedWorkspaceId) ?? activeWorkspaces[0] ?? null
  );
}

function toWorkspaceInfo(m: WorkspaceMembershipRow): WorkspaceInfo {
  return {
    id: m.workspaceId,
    slug: m.slug,
    legalName: m.legalName,
    logoUrl: m.logoUrl,
    schemaName: m.schemaName,
    role: m.role,
  };
}

/** The client-safe view of a workspace: everything but the schema name. */
export function toWorkspaceSummary(w: WorkspaceInfo | WorkspaceMembershipRow): WorkspaceSummary {
  const id = 'workspaceId' in w ? w.workspaceId : w.id;
  return { id, slug: w.slug, legalName: w.legalName, role: w.role };
}

function toSummaries(memberships: WorkspaceMembershipRow[]): WorkspaceSummary[] {
  return memberships.map(toWorkspaceSummary);
}

/** Signs in with identifier (email or phone) and password, pinned to a workspace. */
export async function signInWithPassword(
  input: SignInInput,
): Promise<Result<SignInSuccess, ErrorCode>> {
  const identifier = input.identifier.trim().toLowerCase();
  const { password, workspaceSlug, ip, userAgent, rememberMe } = input;

  if (!identifier || !password) {
    return err('VALIDATION_FAILED');
  }

  const user = await authRepository.findUserByEmail(identifier);
  if (!user?.passwordHash || user.status !== 'active') {
    await verifyPassword(password, DUMMY_HASH);
    return err('INVALID_CREDENTIALS');
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return err('INVALID_CREDENTIALS');
  }

  const activeWorkspaces = usableWorkspaces(
    await authRepository.findWorkspaceMembershipsForUser(user.id),
  );
  const selectedWorkspace = selectSessionWorkspace(activeWorkspaces, null, workspaceSlug);
  if (!selectedWorkspace) {
    return err('WORKSPACE_ACCESS_DENIED');
  }

  const { rawToken, tokenHash } = generateSecureToken(32);
  const now = new Date();
  const maxAgeSeconds = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  const expiresAt = new Date(now.getTime() + maxAgeSeconds * 1000);

  await authRepository.platformTransaction(async (tx) => {
    await authRepository.insertSession(
      {
        userId: user.id,
        tokenHash,
        workspaceId: selectedWorkspace.workspaceId,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
        expiresAt,
      },
      tx,
    );
    await authRepository.touchUserLastSeen(user.id, now, tx);
  });

  return ok({
    rawToken,
    user: { id: user.id, email: user.email, fullName: user.fullName, locale: user.locale },
    workspace: toWorkspaceInfo(selectedWorkspace),
    availableWorkspaces: toSummaries(activeWorkspaces),
  });
}

/**
 * Resolves a raw session token to its session, user, and usable memberships.
 * Shared by every operation that needs an authenticated caller.
 */
async function loadSession(
  rawToken: string,
  now: Date,
): Promise<Result<SessionLookup & { usable: WorkspaceMembershipRow[] }, ErrorCode>> {
  if (!rawToken) {
    return err('UNAUTHENTICATED');
  }

  const lookup = await authRepository.findSessionByTokenHash(hashSha256(rawToken), now);
  if (lookup?.user.status !== 'active') {
    return err('UNAUTHENTICATED');
  }

  const usable = usableWorkspaces(lookup.memberships);
  if (usable.length === 0) {
    return err('WORKSPACE_ACCESS_DENIED');
  }

  return ok({ ...lookup, usable });
}

/**
 * Validates an incoming session token, returning the user and active workspace.
 *
 * `requestedWorkspaceSlug` — the host-resolved workspace for this request, when
 * known — is enforced: if the caller is a member of that workspace the request
 * resolves to it; if not, this returns WORKSPACE_ACCESS_DENIED rather than silently
 * serving another workspace under that host. See docs/WORKSPACE_ISOLATION.md §3.
 *
 * Read-only apart from an occasional `last_used_at` touch.
 */
export async function validateSession(
  rawToken: string,
  requestedWorkspaceSlug?: string,
): Promise<Result<SessionValidationSuccess, ErrorCode>> {
  const now = new Date();
  const loaded = await loadSession(rawToken, now);
  if (!loaded.ok) {
    return loaded;
  }
  const { session, user, usable } = loaded.value;

  const activeWs = selectSessionWorkspace(usable, session.workspaceId, requestedWorkspaceSlug);
  if (!activeWs) {
    return err('WORKSPACE_ACCESS_DENIED');
  }

  if (now.getTime() - session.lastUsedAt.getTime() > LAST_USED_WRITE_INTERVAL_MS) {
    await authRepository.touchSessionLastUsed(session.id, now);
  }

  return ok({
    sessionId: session.id,
    user: { id: user.id, email: user.email, fullName: user.fullName, locale: user.locale },
    activeWorkspace: toWorkspaceInfo(activeWs),
    availableWorkspaces: toSummaries(usable),
  });
}

/** Signs out by revoking the session. */
export async function signOut(rawToken: string): Promise<Result<void, ErrorCode>> {
  if (!rawToken) {
    return ok(undefined);
  }

  await authRepository.revokeSessionByTokenHash(hashSha256(rawToken), new Date());

  return ok(undefined);
}

/**
 * Sets the workspace a session falls back to when the request host names none.
 * Under subdomain resolution the caller should then navigate to the returned
 * workspace's host — the host, not this row, decides what a request resolves to.
 */
export async function switchActiveWorkspace(
  rawToken: string,
  targetWorkspaceId: WorkspaceId,
): Promise<Result<WorkspaceInfo, ErrorCode>> {
  const loaded = await loadSession(rawToken, new Date());
  if (!loaded.ok) {
    return loaded;
  }

  const target = loaded.value.usable.find((w) => w.workspaceId === targetWorkspaceId);
  if (!target) {
    return err('WORKSPACE_ACCESS_DENIED');
  }

  await authRepository.updateSessionWorkspace(loaded.value.session.id, targetWorkspaceId);

  return ok(toWorkspaceInfo(target));
}
