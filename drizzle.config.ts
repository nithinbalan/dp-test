import { defineConfig } from 'drizzle-kit';

/**
 * Hand-authored SQL in db/schema/ is the source of truth (docs/DATABASE_DESIGN.md
 * §9, docs/WORKSPACE_ISOLATION.md §8) and is applied by the resumable runner in
 * tooling/scripts/migrate.ts — never by drizzle-kit. The Drizzle schema under
 * src/server/db/schema/ is a partial mirror held to the SQL by `pnpm db:check`.
 *
 * This config exists for `drizzle-kit` tooling (studio, introspection diffs) only.
 * `pnpm db:generate` output is a diagnostic, not a migration: never apply it.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema/*.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL ?? '',
  },
});
