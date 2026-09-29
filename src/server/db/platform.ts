/**
 * Platform Database interface for the `public` schema.
 *
 * This provides access to platform control plane data: workspaces, users,
 * memberships, sessions, and auth challenges.
 *
 * For tenant data, use `withWorkspace()` from `@server/workspace`.
 * See docs/WORKSPACE_ISOLATION.md §1.
 */
import type { PgDatabase } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { db } from './client';
import type * as platformSchema from './schema/platform';
export * from './schema/platform';

/**
 * Anything a platform repository can run a query on: the pool-backed client or a
 * transaction opened by {@link platformTransaction}. Repository functions take one
 * of these as their last parameter (defaulting to {@link platformDb}) so a service
 * can compose several of them atomically without the repository knowing.
 */
export type PlatformExecutor = PgDatabase<PostgresJsQueryResultHKT, typeof platformSchema>;

/** Drizzle client configured for platform control-plane queries in the public schema. */
export const platformDb: PlatformExecutor = db;

/**
 * Runs `fn` inside one transaction on the platform (`public`) schema. Commits when
 * `fn` resolves, rolls back when it throws. Pass the `tx` it hands you into every
 * repository call that must be atomic with the others.
 */
export function platformTransaction<T>(fn: (tx: PlatformExecutor) => Promise<T>): Promise<T> {
  return db.transaction((tx) => fn(tx));
}
