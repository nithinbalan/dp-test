/**
 * RAW DATABASE CLIENT — the most dangerous module in the repo.
 *
 * `local/require-workspace-scope` blocks importing this from anywhere except
 * src/server/db/** and src/server/workspace/**. Everything else goes through
 * `withWorkspace()` (tenant data) or a `repository.ts` over `platformDb` (public
 * schema). See docs/WORKSPACE_ISOLATION.md.
 *
 * The app role is LOW-PRIVILEGE: it cannot CREATE SCHEMA or DROP. Provisioning
 * uses DATABASE_MIGRATION_URL with a separate role that request-handling code
 * never has access to.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@shared/config';
import * as platformSchema from './schema/platform';

const globalForDb = globalThis as unknown as {
  rawPostgresClient: postgres.Sql | undefined;
};

export const rawClient =
  globalForDb.rawPostgresClient ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (env.NODE_ENV !== 'production') {
  globalForDb.rawPostgresClient = rawClient;
}

/** Platform (`public` schema) client. Carries the platform tables for typed queries. */
export const db = drizzle(rawClient, { schema: platformSchema });

/**
 * Root for workspace transactions. Deliberately built with NO schema: inside a
 * workspace transaction `search_path` is the tenant schema alone, so the relational
 * query API (`tx.query.*`) must not advertise platform tables that would resolve to
 * nothing there. Only `withWorkspace()` opens transactions on this.
 */
export const workspaceRoot = drizzle(rawClient);
