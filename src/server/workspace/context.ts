/**
 * WorkspaceContext — unforgeable proof that a workspace was resolved AND the
 * actor was authorized for it. See docs/WORKSPACE_ISOLATION.md §4.
 *
 * There is deliberately NO public constructor. The only producer is
 * `resolveWorkspaceContext()`, which requires an authenticated session. This is
 * what makes "pass the workspace id from the request body" a compile error
 * rather than a code-review catch.
 */
import type { SchemaName, UserId, WorkspaceId } from '@shared/types';

/** Membership roles, most privileged first. Authorization compares against these. */
export const WORKSPACE_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
/** A single membership role. */
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/**
 * Unforgeable proof that a workspace was resolved AND the actor was authorized for it.
 *
 * There is deliberately no public constructor — only `resolveWorkspaceContext()` can
 * mint one, and it requires an authenticated session. That makes "pass the workspace id
 * from the request body" a compile error rather than a code-review catch, which is the
 * cheapest high-value part of the isolation design. See docs/WORKSPACE_ISOLATION.md §4.
 */
export type WorkspaceContext = {
  readonly workspaceId: WorkspaceId;
  /** Validated schema identifier from the registry. Never derived from a slug. */
  readonly schema: SchemaName;
  readonly actorId: UserId;
  readonly role: WorkspaceRole;
};

/** Slug rules — see docs/WORKSPACE_ISOLATION.md §3. Reserved names rejected at creation. */
export const WORKSPACE_SLUG_PATTERN = /^[a-z][a-z0-9-]{2,38}$/;
/** Slugs that would collide with infrastructure hostnames or Postgres internals. */
export const RESERVED_SLUGS = new Set([
  'www',
  'api',
  'app',
  'admin',
  'public',
  'static',
  'assets',
  'auth',
  'login',
  'signup',
  'support',
  'status',
  'docs',
  'blog',
  'help',
  'billing',
  'internal',
  'system',
]);

/**
 * Shape + reservation check for a workspace slug, applied at creation time.
 *
 * A slug never becomes a schema name by concatenation — the registry maps one to the
 * other — but validating here keeps hostile input out of the registry in the first place.
 */
export function isValidWorkspaceSlug(slug: string): boolean {
  return WORKSPACE_SLUG_PATTERN.test(slug) && !RESERVED_SLUGS.has(slug) && !slug.startsWith('pg_');
}

/**
 * Extracts and shape-validates the workspace slug from a `Host` header under the
 * `subdomain` resolution strategy — `acme.example.com` → `acme`, `example.com` (no
 * subdomain) and `www.example.com` → `null`. Shared by middleware (page routes) and
 * Route Handlers directly (API routes are outside the middleware matcher — see
 * src/middleware.ts — so they cannot rely on a header middleware forwards).
 * Still untrusted input: shape-checked here, membership-checked by
 * `validateSession`. See docs/WORKSPACE_ISOLATION.md §3.
 */
export function resolveWorkspaceSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostParts = host.split(':')[0]?.split('.') ?? [];
  if (hostParts.length <= 2) return null;
  const potentialSlug = hostParts[0]?.toLowerCase() ?? '';
  return isValidWorkspaceSlug(potentialSlug) ? potentialSlug : null;
}
