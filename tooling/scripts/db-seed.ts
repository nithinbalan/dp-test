#!/usr/bin/env -S node --experimental-strip-types
/**
 * Applies every file in db/seed/*.sql against `public`, in filename order.
 *
 * Unlike db/schema/*.sql (versioned, applied exactly once, checksummed — see
 * migrate.ts), a seed file is reference/catalog data meant to be extended in
 * place and re-run freely. Each file is responsible for its own idempotency
 * (ON CONFLICT DO NOTHING, as db/seed/0001 already does) — this runner does
 * not track applied versions, it just re-applies every file every time.
 *
 * This was previously a gap: db/seed/0001_module_permission_catalog.sql
 * existed with no script that ever ran it. This script, plus the
 * `pnpm db:seed` entry in package.json, is that missing piece.
 *
 * Connects with DATABASE_MIGRATION_URL, same as migrate.ts/provision.ts —
 * seeding reference data is a schema-privileged operation, not a request-time
 * one.
 *
 * Usage:
 *   pnpm db:seed             apply every db/seed/*.sql file to public
 *   pnpm db:seed --dry-run   list the files that would run; makes no writes
 */

import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import postgres from 'postgres';
import { loadMigrationUrl } from './lib/db-migrations.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const SEED_DIR = join(ROOT, 'db/seed');

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const entries = (await readdir(SEED_DIR)).filter((file) => file.endsWith('.sql')).sort();

  if (entries.length === 0) {
    console.log('No seed files found in db/seed/.');
    return;
  }

  console.log(`${String(entries.length)} seed file(s) found in db/seed/`);

  const sql = postgres(loadMigrationUrl(), { max: 1 });
  try {
    for (const file of entries) {
      if (dryRun) {
        console.log(`  + ${file} would apply to public`);
        continue;
      }
      const path = join(SEED_DIR, file);
      await sql.file(path);
      console.log(`  ✓ ${file} applied to public`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }

  console.log(dryRun ? '\nDry run complete — no changes made.' : '\nAll seed files applied.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
