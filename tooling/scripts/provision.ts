#!/usr/bin/env -S node --experimental-strip-types
/**
 * Provisions a workspace: registry row, schema, migrations, grants.
 *
 * This is the only supported way to create a tenant. `db:migrate` deliberately
 * refuses to create a schema, because creating one is four steps and skipping
 * any of them produces a workspace that looks provisioned and is not:
 *
 *   1. `public.workspace` row      — the registry is what maps slug → schema
 *   2. `CREATE SCHEMA ws_<ulid>`   — name generated here, never user-supplied
 *   3. every workspace migration   — so the new schema is at the current version
 *   4. GRANTs to the app role      — without these the app gets
 *                                    "permission denied for schema ws_…" on
 *                                    every query, long after provisioning
 *                                    reported success
 *
 * Each step is idempotent, so `--repair` re-runs them against an existing
 * registry row to finish a provisioning that died halfway
 * (docs/WORKSPACE_ISOLATION.md §8: a failure at workspace 400 of 900 must be
 * safe to re-run).
 *
 * Connects with DATABASE_MIGRATION_URL — the app role cannot CREATE SCHEMA, and
 * that is deliberate (docs/WORKSPACE_ISOLATION.md §6).
 *
 * Usage:
 *   pnpm db:provision --slug acme --name "Acme Private Limited"
 *   pnpm db:provision --slug acme --name "Acme" --region ap-south-2
 *   pnpm db:provision --repair acme      finish/repair an existing workspace
 *   pnpm db:provision --slug acme --name "Acme" --dry-run
 */

import postgres from 'postgres';
import { seedDefaultRoles } from './lib/access-control-seed.ts';
import { seedGapAssessmentQuestionnaire } from './lib/gap-assessment-seed.ts';
import {
  appRole,
  applyMigration,
  assertWorkspaceSchemaName,
  getAppliedChecksum,
  grantAppRoleOnSchema,
  loadMigrationUrl,
  loadMigrations,
  newWorkspaceSchemaName,
} from './lib/db-migrations.ts';

/** Mirrors isValidWorkspaceSlug() in src/server/workspace/context.ts. */
const SLUG_RE = /^[a-z][a-z0-9-]{2,38}$/;
const RESERVED = new Set([
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

type Args = {
  slug: string;
  name: string;
  region: string;
  repair: boolean;
  dryRun: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i === -1 ? undefined : argv[i + 1];
  };

  const repairSlug = get('--repair');
  const slug = (repairSlug ?? get('--slug') ?? '').trim().toLowerCase();
  const name = (get('--name') ?? '').trim();
  const region = get('--region') ?? 'ap-south-1';
  const repair = repairSlug !== undefined;

  if (!slug) {
    throw new Error(
      'Usage: pnpm db:provision --slug <slug> --name "<legal name>"\n' +
        '       pnpm db:provision --repair <slug>',
    );
  }
  if (!SLUG_RE.test(slug)) {
    throw new Error(
      `Slug "${slug}" is invalid — must match ^[a-z][a-z0-9-]{2,38}$ ` +
        `(see src/server/workspace/context.ts).`,
    );
  }
  if (RESERVED.has(slug)) {
    throw new Error(`Slug "${slug}" is reserved — it would collide with an infrastructure host.`);
  }
  if (!repair && !name) {
    throw new Error("--name is required (the workspace's legal name).");
  }
  if (!['ap-south-1', 'ap-south-2'].includes(region)) {
    throw new Error(`Region "${region}" is not a valid data_region.`);
  }

  return { slug, name, region, repair, dryRun: argv.includes('--dry-run') };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const role = appRole();
  const migrations = (await loadMigrations()).filter((m) => m.scope === 'workspace');
  const sql = postgres(loadMigrationUrl(), { max: 1 });

  try {
    const existing = await sql<{ id: string; schema_name: string; legal_name: string }[]>`
      select id, schema_name, legal_name from public.workspace where slug = ${args.slug}
    `;
    const found = existing[0];

    if (found && !args.repair) {
      throw new Error(
        `Workspace "${args.slug}" already exists (${found.schema_name}). ` +
          `Use --repair ${args.slug} to finish or repair it.`,
      );
    }
    if (!found && args.repair) {
      throw new Error(`No workspace with slug "${args.slug}" to repair.`);
    }

    const schemaName = found?.schema_name ?? newWorkspaceSchemaName();
    assertWorkspaceSchemaName(schemaName, 'provision');

    if (args.dryRun) {
      console.log(`[dry run] would provision "${args.slug}" as ${schemaName}`);
      console.log(
        `[dry run]   registry row, CREATE SCHEMA, ${String(migrations.length)} migration(s), grants to ${role}`,
      );
      return;
    }

    console.log(`Provisioning "${args.slug}" → ${schemaName}`);

    // 1. registry row
    if (!found) {
      await sql`
        insert into public.workspace (slug, schema_name, legal_name, status, region)
        values (${args.slug}, ${schemaName}, ${args.name}, 'trial', ${args.region}::data_region)
      `;
      console.log(`  ✓ registry row`);
    } else {
      console.log(`  = registry row exists`);
    }

    const workspaceRow = await sql<{ id: string }[]>`
      select id from public.workspace where slug = ${args.slug}
    `;
    const workspaceId = workspaceRow[0]?.id;
    if (!workspaceId) throw new Error(`Registry row for "${args.slug}" vanished mid-provision.`);

    const job = await sql<{ id: string }[]>`
      insert into public.provisioning_job (workspace_id, kind, status, started_at)
      values (${workspaceId}, 'create', 'running', now())
      returning id
    `;
    const jobId = job[0]?.id;
    if (!jobId) throw new Error('provisioning_job insert returned no id');

    try {
      // 2. schema
      await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      console.log(`  ✓ schema`);

      // 3. migrations
      for (const migration of migrations) {
        if (await getAppliedChecksum(sql, schemaName, migration.version)) {
          console.log(`  = ${migration.version}`);
          continue;
        }
        const ms = await applyMigration(sql, migration, schemaName);
        console.log(`  ✓ ${migration.version} (${String(ms)}ms)`);
      }

      // 4. grants — the step whose absence fails silently until the first query
      await grantAppRoleOnSchema(sql, schemaName, role);
      console.log(`  ✓ grants to ${role}`);

      // 5. default system roles — data, not structure, so it runs after grants
      // and is safe to skip/retry independently of the schema steps above.
      await seedDefaultRoles(sql, schemaName);
      console.log(`  ✓ default roles`);

      // 5b. Gap Assessment questionnaire — same "data, not structure" reasoning.
      await seedGapAssessmentQuestionnaire(sql, schemaName);
      console.log(`  ✓ gap assessment questionnaire`);

      await sql`
        update public.provisioning_job
        set status = 'done', finished_at = now() where id = ${jobId}
      `;
      await sql`
        update public.workspace set provisioned_at = now() where id = ${workspaceId}
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await sql`
        update public.provisioning_job
        set status = 'failed', error = ${message}, finished_at = now(), attempts = attempts + 1
        where id = ${jobId}
      `;
      throw new Error(`${message}\n\nRe-run safely with: pnpm db:provision --repair ${args.slug}`);
    }

    console.log(`\nProvisioned ${args.slug} (${schemaName}). Verify: pnpm db:status`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
