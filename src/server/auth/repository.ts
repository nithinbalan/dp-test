/**
 * Pure data access for the auth domain — platform (public-schema) tables only.
 *
 * One function per query. No business rules: a workspace-status allowlist, an
 * attempt-limit decision, or a "which workspace wins" choice belongs in the service,
 * not here. See docs/ARCHITECTURE.md "Layering (server)".
 *
 * Every function takes an executor as its LAST parameter, defaulting to the pool.
 * A service that needs several of these to commit or fail together passes the `tx`
 * it gets from `platformTransaction()` into each one.
 *
 * Auth is a platform domain, not a tenant one — it reads/writes `public` schema
 * tables directly via `platformDb`, never `withWorkspace()`. See
 * docs/WORKSPACE_ISOLATION.md §1.
 */
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import {
  authChallenge,
  membership,
  platformDb,
  platformTransaction,
  session,
  userAccount,
  workspace,
  type PlatformExecutor,
  type UserAccountStatus,
} from '@server/db';
import type { WorkspaceRole } from '@server/workspace/context';
import type { SchemaName, UserId, WorkspaceId } from '@shared/types';

/** Re-exported so a service can open a transaction without importing `@server/db`. */
export { platformTransaction };

/** Row shape for a user's membership joined with its workspace. */
export type WorkspaceMembershipRow = {
  role: WorkspaceRole;
  workspaceId: WorkspaceId;
  slug: string;
  legalName: string;
  logoUrl: string | null;
  schemaName: SchemaName;
  status: (typeof workspace.$inferSelect)['status'];
};

/** The user columns the auth flows need. Never the password hash. */
export type UserRow = {
  id: UserId;
  email: string;
  fullName: string;
  locale: string;
  status: UserAccountStatus;
};

/** Everything a session token resolves to, fetched in one round trip. */
export type SessionLookup = {
  session: {
    id: string;
    workspaceId: WorkspaceId | null;
    lastUsedAt: Date;
  };
  user: UserRow;
  memberships: WorkspaceMembershipRow[];
};

type NewSessionRow = typeof session.$inferInsert;
type NewAuthChallengeRow = typeof authChallenge.$inferInsert;

const workspaceColumns = {
  workspaceId: workspace.id,
  slug: workspace.slug,
  legalName: workspace.legalName,
  logoUrl: workspace.logoUrl,
  schemaName: workspace.schemaName,
  status: workspace.status,
};

/** Finds a user account by email, regardless of status. Includes the password hash. */
export async function findUserByEmail(email: string, db: PlatformExecutor = platformDb) {
  const rows = await db.select().from(userAccount).where(eq(userAccount.email, email)).limit(1);
  return rows[0] ?? null;
}

/** All workspaces a user holds an active membership in, joined with workspace details. */
export async function findWorkspaceMembershipsForUser(
  userId: UserId,
  db: PlatformExecutor = platformDb,
): Promise<WorkspaceMembershipRow[]> {
  return db
    .select({ role: membership.role, ...workspaceColumns })
    .from(membership)
    .innerJoin(workspace, eq(membership.workspaceId, workspace.id))
    .where(and(eq(membership.userId, userId), eq(membership.status, 'active')));
}

/**
 * Resolves an unrevoked, unexpired session token to its user and every active
 * membership in ONE query — this runs on every authenticated request, so it must
 * not fan out. Memberships are left-joined: a user with none still resolves.
 */
export async function findSessionByTokenHash(
  tokenHash: Buffer,
  now: Date,
  db: PlatformExecutor = platformDb,
): Promise<SessionLookup | null> {
  const rows = await db
    .select({
      session: { id: session.id, workspaceId: session.workspaceId, lastUsedAt: session.lastUsedAt },
      user: {
        id: userAccount.id,
        email: userAccount.email,
        fullName: userAccount.fullName,
        locale: userAccount.locale,
        status: userAccount.status,
      },
      // Two nested objects, one per left-joined table: Drizzle nulls a nested
      // object as a whole only when every column in it comes from the same table.
      membership: { role: membership.role },
      workspace: workspaceColumns,
    })
    .from(session)
    .innerJoin(userAccount, eq(session.userId, userAccount.id))
    .leftJoin(
      membership,
      and(eq(membership.userId, userAccount.id), eq(membership.status, 'active')),
    )
    .leftJoin(workspace, eq(workspace.id, membership.workspaceId))
    .where(
      and(eq(session.tokenHash, tokenHash), isNull(session.revokedAt), gt(session.expiresAt, now)),
    );

  const first = rows[0];
  if (!first) return null;

  const memberships = rows.flatMap((r) =>
    r.membership && r.workspace ? [{ role: r.membership.role, ...r.workspace }] : [],
  );
  return { session: first.session, user: first.user, memberships };
}

/** Inserts a new session row. */
export async function insertSession(
  values: NewSessionRow,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db.insert(session).values(values);
}

/** Sets the workspace a session falls back to when the request host names none. */
export async function updateSessionWorkspace(
  sessionId: string,
  workspaceId: WorkspaceId,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db.update(session).set({ workspaceId }).where(eq(session.id, sessionId));
}

/** Records that a session was used. */
export async function touchSessionLastUsed(
  sessionId: string,
  lastUsedAt: Date,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db.update(session).set({ lastUsedAt }).where(eq(session.id, sessionId));
}

/** Marks a session revoked by its token hash. */
export async function revokeSessionByTokenHash(
  tokenHash: Buffer,
  revokedAt: Date,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db.update(session).set({ revokedAt }).where(eq(session.tokenHash, tokenHash));
}

/** Revokes every session belonging to a user (e.g. after a password reset). */
export async function revokeAllSessionsForUser(
  userId: UserId,
  revokedAt: Date,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db.update(session).set({ revokedAt }).where(eq(session.userId, userId));
}

/** Updates a user's `lastSeenAt` timestamp. */
export async function touchUserLastSeen(
  userId: UserId,
  at: Date,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db.update(userAccount).set({ lastSeenAt: at }).where(eq(userAccount.id, userId));
}

/** Sets a user's password hash. */
export async function updateUserPassword(
  userId: UserId,
  passwordHash: string,
  updatedAt: Date,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db.update(userAccount).set({ passwordHash, updatedAt }).where(eq(userAccount.id, userId));
}

/** Marks every still-open password-reset challenge for a user as consumed. */
export async function consumeActivePasswordResetChallenges(
  userId: UserId,
  consumedAt: Date,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db
    .update(authChallenge)
    .set({ consumedAt })
    .where(
      and(
        eq(authChallenge.userId, userId),
        eq(authChallenge.purpose, 'password_reset'),
        isNull(authChallenge.consumedAt),
      ),
    );
}

/** Inserts a new auth challenge row (OTP or reset-token exchange). */
export async function insertAuthChallenge(
  values: NewAuthChallengeRow,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db.insert(authChallenge).values(values);
}

/** Finds the most recent open `password_reset` challenge for an email. */
export async function findActivePasswordResetChallengeByEmail(
  email: string,
  now: Date,
  db: PlatformExecutor = platformDb,
) {
  const rows = await db
    .select()
    .from(authChallenge)
    .where(
      and(
        eq(authChallenge.email, email),
        eq(authChallenge.purpose, 'password_reset'),
        isNull(authChallenge.consumedAt),
        gt(authChallenge.expiresAt, now),
      ),
    )
    .orderBy(desc(authChallenge.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Sets a challenge's attempt count. */
export async function setChallengeAttempts(
  challengeId: string,
  attempts: number,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db.update(authChallenge).set({ attempts }).where(eq(authChallenge.id, challengeId));
}

/** Exchanges a verified OTP challenge for a short-lived reset-token challenge, in place. */
export async function markChallengeVerified(
  challengeId: string,
  tokenHash: Buffer,
  expiresAt: Date,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db
    .update(authChallenge)
    .set({ codeHash: tokenHash, purpose: 'password_reset_verified', expiresAt })
    .where(eq(authChallenge.id, challengeId));
}

/** Finds a still-open `password_reset_verified` challenge by its reset-token hash. */
export async function findVerifiedResetChallengeByTokenHash(
  tokenHash: Buffer,
  now: Date,
  db: PlatformExecutor = platformDb,
) {
  const rows = await db
    .select()
    .from(authChallenge)
    .where(
      and(
        eq(authChallenge.codeHash, tokenHash),
        eq(authChallenge.purpose, 'password_reset_verified'),
        isNull(authChallenge.consumedAt),
        gt(authChallenge.expiresAt, now),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Marks a challenge consumed. */
export async function consumeChallenge(
  challengeId: string,
  consumedAt: Date,
  db: PlatformExecutor = platformDb,
): Promise<void> {
  await db.update(authChallenge).set({ consumedAt }).where(eq(authChallenge.id, challengeId));
}
