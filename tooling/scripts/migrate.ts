#!/usr/bin/env -S node --experimental-strip-types
/**
 * Resumable per-schema migration runner.
 * See docs/WORKSPACE_ISOLATION.md §8 and docs/DATABASE_DESIGN.md §9 — this script
 * is the runner those sections describe, not a general-purpose migration tool.
 *
 * - Every file in db/schema/*.sql is a versioned migration, applied exactly once
 *   per target schema. By filename: anything containing "platform" targets
 *   `public`; anything containing "workspace" targets every provisioned
 *   workspace schema (`public.workspace.schema_name`).
 * - Applied versions are recorded in `public.schema_migration`, one row per
 *   (schema, version), with a sha256 checksum of the file that was applied. A
 *   migration file that changed after being applied is a hard error — never a
 *   silent reapply (expand/contract only; write a new migration instead).
 * - Each (schema, version) runs in its own transaction with `search_path` pinned
 *   to that schema alone. A failure on one workspace is logged and does not stop
 *   the others; the ledger makes re-running safe.
 * - This command MIGRATES. It never creates a schema: a workspace row whose
 *   schema is missing is reported and skipped, because silently creating it here
 *   would skip the grants that `db:provision` applies and leave the app unable to
 *   read the tenant it just "successfully" migrated.
 * - Connects with DATABASE_MIGRATION_URL, a separate and more privileged role
 *   than the app uses at request time (docs/WORKSPACE_ISOLATION.md §6).
 *
 * Usage:
 *   pnpm db:migrate            apply every pending migration
 *   pnpm db:migrate --dry-run  print what would run; makes no writes
 */

import postgres from 'postgres';
import {
  appRole,
  applyMigration,
  assertChecksumMatches,
  assertWorkspaceSchemaName,
  fileChecksum,
  getAppliedChecksum,
  grantAppRoleOnSchema,
  listExistingSchemas,
  listWorkspaces,
  loadMigrationUrl,
  loadMigrations,
  type Migration,
} from './lib/db-migrations.ts';

type Failure = { schemaName: string; version: string; message: string };

function isUndefinedTable(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '42P01'
  );
}

async function applyToPublic(
  sql: postgres.Sql,
  migration: Migration,
  dryRun: boolean,
): Promise<void> {
  const checksum = await fileChecksum(migration.path);
  const applied = await getAppliedChecksum(sql, 'public', migration.version);
  if (applied) {
    assertChecksumMatches(migration, 'public', applied, checksum);
    console.log(`  = ${migration.version} already applied to public`);
    return;
  }
  if (dryRun) {
    console.log(`  + ${migration.version} would apply to public`);
    return;
  }
  await applyMigration(sql, migration, 'public');
  console.log(`  ✓ ${migration.version} applied to public`);
}

async function applyToWorkspaces(
  sql: postgres.Sql,
  migration: Migration,
  dryRun: boolean,
  failures: Failure[],
): Promise<void> {
  const checksum = await fileChecksum(migration.path);

  let workspaces;
  try {
    workspaces = await listWorkspaces(sql);
  } catch (error) {
    if (dryRun && isUndefinedTable(error)) {
      console.log(
        `  + ${migration.version} would apply to every workspace schema once public is migrated`,
      );
      return;
    }
    throw error;
  }

  if (workspaces.length === 0) {
    console.log(`  · no workspaces provisioned yet — nothing to apply (pnpm db:provision)`);
    return;
  }

  const existing = await listExistingSchemas(sql);

  for (const workspace of workspaces) {
    const schemaName = workspace.schema_name;
    assertWorkspaceSchemaName(schemaName, `public.workspace row "${workspace.slug}"`);

    if (!existing.has(schemaName)) {
      const message = `schema does not exist — run: pnpm db:provision --repair ${workspace.slug}`;
      failures.push({ schemaName, version: migration.version, message });
      console.error(`  ✗ ${schemaName} (${workspace.slug}): ${message}`);
      continue;
    }

    const applied = await getAppliedChecksum(sql, schemaName, migration.version);
    if (applied) {
      assertChecksumMatches(migration, schemaName, applied, checksum);
      console.log(`  = ${migration.version} already applied to ${schemaName} (${workspace.slug})`);
      continue;
    }
    if (dryRun) {
      console.log(`  + ${migration.version} would apply to ${schemaName} (${workspace.slug})`);
      continue;
    }

    try {
      const ms = await applyMigration(sql, migration, schemaName);
      console.log(
        `  ✓ ${migration.version} applied to ${schemaName} (${workspace.slug}) in ${String(ms)}ms`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ schemaName, version: migration.version, message });
      console.error(
        `  ✗ ${migration.version} FAILED on ${schemaName} (${workspace.slug}): ${message}`,
      );
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const unknown = args.filter((arg) => arg !== '--dry-run');
  if (unknown.length > 0) {
    throw new Error(`Unknown argument(s): ${unknown.join(', ')}`);
  }

  const migrationUrl = loadMigrationUrl();
  const migrations = await loadMigrations();
  console.log(
    `${dryRun ? '[dry run] ' : ''}${String(migrations.length)} migration file(s) found in db/schema/`,
  );

  const sql = postgres(migrationUrl, { max: 1 });
  const failures: Failure[] = [];
  try {
    for (const migration of migrations) {
      console.log(`\n${migration.file} (${migration.scope})`);
      if (migration.scope === 'public') {
        await applyToPublic(sql, migration, dryRun);
      } else {
        await applyToWorkspaces(sql, migration, dryRun, failures);
      }
    }

    // `public` is never provisioned the way a workspace schema is (there is no
    // per-tenant step that would grant it), so re-assert the app role's grants
    // here on every run — idempotent, and it closes the gap where an app-role
    // query 500s with "permission denied" on a table that migrated cleanly.
    if (!dryRun) {
      const role = appRole();
      await grantAppRoleOnSchema(sql, 'public', role);
      console.log(`\n✓ grants to ${role} on public`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }

  if (failures.length > 0) {
    console.error(
      `\n${String(failures.length)} workspace migration(s) failed. Safe to re-run — ` +
        `already-applied (schema, version) pairs are skipped.`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(dryRun ? '\nDry run complete — no changes made.' : '\nAll migrations applied.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
