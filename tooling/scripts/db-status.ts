#!/usr/bin/env -S node --experimental-strip-types
/**
 * Reports the migration state of every schema, and fails on drift.
 *
 * docs/WORKSPACE_ISOLATION.md §8 requires CI to assert zero schema drift: every
 * workspace schema at the same version. Drift between tenants is how
 * "works for most customers" bugs are born — one workspace missing a column
 * produces a bug that is unreproducible everywhere else.
 *
 * Exits non-zero when any of these is true, so it can gate a deploy:
 *   - a workspace is behind the latest migration
 *   - a registry row has no schema (provisioning died halfway)
 *   - a schema exists that no registry row claims (orphan)
 *   - the app role cannot USAGE a provisioned schema (grants were missed)
 *
 * Usage:
 *   pnpm db:status
 */

import postgres from 'postgres';
import {
  appRole,
  listExistingSchemas,
  listWorkspaces,
  loadMigrationUrl,
  loadMigrations,
} from './lib/db-migrations.ts';

type Applied = { schema_name: string; version: string };

async function main(): Promise<void> {
  const migrations = await loadMigrations();
  const publicTarget = migrations.filter((m) => m.scope === 'public').map((m) => m.version);
  const workspaceTarget = migrations.filter((m) => m.scope === 'workspace').map((m) => m.version);
  const role = appRole();

  const sql = postgres(loadMigrationUrl(), { max: 1 });
  const problems: string[] = [];

  try {
    const applied = await sql<Applied[]>`
      select schema_name, version from public.schema_migration
    `;
    const bySchema = new Map<string, Set<string>>();
    for (const row of applied) {
      if (!bySchema.has(row.schema_name)) bySchema.set(row.schema_name, new Set());
      bySchema.get(row.schema_name)?.add(row.version);
    }

    // ---- public ------------------------------------------------------------
    const publicApplied = bySchema.get('public') ?? new Set();
    const publicMissing = publicTarget.filter((v) => !publicApplied.has(v));
    console.log(`public`);
    console.log(
      `  ${publicMissing.length === 0 ? '✓' : '✗'} ${String(publicApplied.size)}/${String(publicTarget.length)} migration(s)` +
        (publicMissing.length ? `  missing: ${publicMissing.join(', ')}` : ''),
    );
    if (publicMissing.length) problems.push(`public is behind: ${publicMissing.join(', ')}`);

    // ---- workspaces --------------------------------------------------------
    const workspaces = await listWorkspaces(sql);
    const existingSchemas = await listExistingSchemas(sql);

    console.log(`\nworkspaces (${String(workspaces.length)})`);
    if (workspaces.length === 0) {
      console.log(`  · none provisioned — pnpm db:provision --slug <slug> --name "<name>"`);
    }

    for (const ws of workspaces) {
      const schemaApplied = bySchema.get(ws.schema_name) ?? new Set();
      const missing = workspaceTarget.filter((v) => !schemaApplied.has(v));
      const schemaExists = existingSchemas.has(ws.schema_name);

      let canUse = false;
      if (schemaExists) {
        const rows = await sql<{ ok: boolean }[]>`
          select has_schema_privilege(${role}, ${ws.schema_name}, 'USAGE') as ok
        `;
        canUse = rows[0]?.ok ?? false;
      }

      const ok = schemaExists && missing.length === 0 && canUse;
      console.log(
        `  ${ok ? '✓' : '✗'} ${ws.slug.padEnd(20)} ${ws.schema_name}  ` +
          `${String(schemaApplied.size)}/${String(workspaceTarget.length)}`,
      );

      if (!schemaExists) {
        console.log(`      schema missing — pnpm db:provision --repair ${ws.slug}`);
        problems.push(`${ws.slug}: schema missing`);
      } else {
        if (missing.length) {
          console.log(`      behind: ${missing.join(', ')} — pnpm db:migrate`);
          problems.push(`${ws.slug}: behind (${missing.join(', ')})`);
        }
        if (!canUse) {
          console.log(`      ${role} lacks USAGE — pnpm db:provision --repair ${ws.slug}`);
          problems.push(`${ws.slug}: ${role} cannot access the schema`);
        }
      }
    }

    // ---- orphans -----------------------------------------------------------
    const registered = new Set(workspaces.map((w) => w.schema_name));
    const orphans = [...existingSchemas].filter((s) => !registered.has(s));
    if (orphans.length) {
      console.log(
        `\norphan schemas (${String(orphans.length)}) — exist but no active registry row`,
      );
      for (const o of orphans) console.log(`  ✗ ${o}`);
      problems.push(`${String(orphans.length)} orphan schema(s): ${orphans.join(', ')}`);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }

  if (problems.length > 0) {
    console.error(`\n${String(problems.length)} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log(`\nNo drift. Every schema is at the current version.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
