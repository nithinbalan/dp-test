/**
 * Shared migration machinery for the schema-per-workspace runner.
 *
 * Used by three commands that must agree exactly on how a migration is applied,
 * because disagreement between them IS schema drift:
 *
 *   db:migrate    apply pending migrations to public + every provisioned schema
 *   db:provision  create one workspace schema and bring it to the current version
 *   db:status     report the version of every schema, and fail on drift
 *
 * See docs/WORKSPACE_ISOLATION.md §8 and docs/DATABASE_DESIGN.md §9.
 */

import { createHash, randomBytes } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type postgres from 'postgres';

export const ROOT = resolve(import.meta.dirname, '../../..');
export const SCHEMA_DIR = join(ROOT, 'db/schema');

/**
 * Mirrors the `workspace_schema_shape` CHECK in db/schema/0001_platform.sql.
 * Re-validated before any schema name reaches DDL — a schema name is the one
 * value in this system that cannot be parameterised, so it is checked twice.
 */
export const SCHEMA_NAME_RE = /^ws_[0-9a-hjkmnp-tv-z]{26}$/;

export type Scope = 'public' | 'workspace';

export type Migration = {
  version: string;
  file: string;
  path: string;
  scope: Scope;
};

export type WorkspaceRow = { schema_name: string; slug: string };

function scopeForFile(file: string): Scope {
  if (/platform/i.test(file)) return 'public';
  if (/workspace/i.test(file)) return 'workspace';
  throw new Error(
    `db/schema/${file}: cannot determine scope — filename must contain "platform" (targets public) or "workspace" (targets every workspace schema)`,
  );
}

export async function loadMigrations(): Promise<Migration[]> {
  const entries = await readdir(SCHEMA_DIR);
  const migrations = entries
    .filter((file) => file.endsWith('.sql'))
    .map((file): Migration => {
      if (!/^\d{4}_.+\.sql$/.test(file)) {
        throw new Error(`db/schema/${file}: filename must match NNNN_description.sql`);
      }
      return {
        version: file.replace(/\.sql$/, ''),
        file,
        path: join(SCHEMA_DIR, file),
        scope: scopeForFile(file),
      };
    })
    .sort((a, b) => a.version.localeCompare(b.version));

  if (migrations.length === 0) {
    throw new Error(`No migration files found in ${SCHEMA_DIR}`);
  }
  return migrations;
}

export async function fileChecksum(path: string): Promise<Buffer> {
  return createHash('sha256')
    .update(await readFile(path))
    .digest();
}

function isUndefinedTable(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '42P01'
  );
}

/** null = never applied. The ledger table itself may not exist yet on a fresh database. */
export async function getAppliedChecksum(
  sql: postgres.Sql,
  schemaName: string,
  version: string,
): Promise<Buffer | null> {
  try {
    const rows = await sql<{ checksum: Buffer }[]>`
      select checksum from public.schema_migration
      where schema_name = ${schemaName} and version = ${version}
    `;
    return rows[0]?.checksum ?? null;
  } catch (error) {
    if (isUndefinedTable(error)) return null;
    throw error;
  }
}

export function assertChecksumMatches(
  migration: Migration,
  schemaName: string,
  appliedChecksum: Buffer,
  currentChecksum: Buffer,
): void {
  if (!appliedChecksum.equals(currentChecksum)) {
    throw new Error(
      `${migration.version} on ${schemaName} was already applied with a different checksum — ` +
        `db/schema/${migration.file} was edited after being applied. Migrations are versioned ` +
        `once (docs/DATABASE_DESIGN.md §9): write a new migration instead of editing this one.`,
    );
  }
}

/** Refuses anything that is not a validated workspace schema name. */
export function assertWorkspaceSchemaName(schemaName: string, context: string): void {
  if (!SCHEMA_NAME_RE.test(schemaName)) {
    throw new Error(
      `${context}: "${schemaName}" fails the workspace schema-name shape ` +
        `(ws_<26-char ulid>) — refusing to interpolate it into DDL`,
    );
  }
}

/**
 * Grants the request-time role what it needs on a schema, and nothing more: it
 * may read and write rows, and may not create, drop or alter anything. Mirrors
 * the grants a new workspace schema gets on provisioning, so `public` — which is
 * never "provisioned", only migrated — gets the same treatment `db:migrate`
 * applies every run. Idempotent: safe to call on every migration pass.
 */
export async function grantAppRoleOnSchema(
  sql: postgres.Sql,
  schemaName: string,
  role: string,
): Promise<void> {
  if (schemaName !== 'public') assertWorkspaceSchemaName(schemaName, 'grantAppRoleOnSchema');
  if (!/^[a-z_][a-z0-9_]*$/.test(role)) {
    throw new Error(`grantAppRoleOnSchema: "${role}" is not a plain role identifier`);
  }
  const schema = `"${schemaName}"`;
  const grantee = `"${role}"`;
  await sql.unsafe(`
    GRANT USAGE ON SCHEMA ${schema} TO ${grantee};
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${schema} TO ${grantee};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${schema} TO ${grantee};
    ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema}
      GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${grantee};
    ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema}
      GRANT USAGE, SELECT ON SEQUENCES TO ${grantee};
  `);
}

/**
 * Applies one migration to one schema, inside one transaction, and records it.
 *
 * `search_path` is set to the target schema ONLY — `public` is never appended.
 * That is invariant 2 of docs/WORKSPACE_ISOLATION.md §5: with `public` on the
 * path a missing table in the workspace schema silently resolves to the shared
 * one, which is a cross-tenant read that looks like a working query. The
 * workspace template qualifies its one genuine public dependency
 * (`public.gin_trgm_ops`) explicitly, precisely so this path can stay clean.
 *
 * `SET LOCAL` — never bare `SET` — so the setting dies with the transaction and
 * cannot survive back into the connection pool.
 */
export async function applyMigration(
  sql: postgres.Sql,
  migration: Migration,
  schemaName: string,
): Promise<number> {
  const start = Date.now();
  const checksum = await fileChecksum(migration.path);

  await sql.begin(async (tx) => {
    if (schemaName !== 'public') {
      assertWorkspaceSchemaName(schemaName, 'applyMigration');
      await tx.unsafe(`set local search_path = "${schemaName}"`);
    }
    await tx.file(migration.path);
    await tx`
      insert into public.schema_migration (schema_name, version, checksum, duration_ms)
      values (${schemaName}, ${migration.version}, ${checksum}, ${Date.now() - start})
    `;
  });

  return Date.now() - start;
}

/** Every workspace that should carry the workspace-scoped migrations. */
export async function listWorkspaces(sql: postgres.Sql): Promise<WorkspaceRow[]> {
  return sql<WorkspaceRow[]>`
    select schema_name, slug from public.workspace
    where status <> 'closed'
    order by schema_name
  `;
}

/** Schemas that actually exist in the database, whatever the registry claims. */
export async function listExistingSchemas(sql: postgres.Sql): Promise<Set<string>> {
  const rows = await sql<{ nspname: string }[]>`
    select nspname from pg_namespace where nspname like 'ws\\_%'
  `;
  return new Set(rows.map((r) => r.nspname));
}

export function loadMigrationUrl(): string {
  return requireEnv('DATABASE_MIGRATION_URL');
}

function requireEnv(name: string): string {
  if (!process.env[name]) {
    try {
      process.loadEnvFile(join(ROOT, '.env.local'));
    } catch {
      // No .env.local (e.g. CI, which sets real env vars) — fall through.
    }
  }
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. See .env.example.`);
  }
  return value;
}

/**
 * The role the app connects as at request time, read from DATABASE_URL.
 *
 * Derived rather than configured separately: a second env var could disagree
 * with the connection string, and the failure mode would be a freshly
 * provisioned workspace the app cannot read.
 */
export function appRole(): string {
  const url = new URL(requireEnv('DATABASE_URL'));
  const role = decodeURIComponent(url.username);
  if (!/^[a-z_][a-z0-9_]*$/.test(role)) {
    throw new Error(`DATABASE_URL username "${role}" is not a plain identifier`);
  }
  return role;
}

const CROCKFORD = '0123456789abcdefghjkmnpqrstvwxyz';

/**
 * `ws_<ulid>` — lowercase Crockford base32, matching the CHECK constraint.
 * Time-ordered prefix so schemas sort by creation in `\dn` and in the registry.
 */
export function newWorkspaceSchemaName(now = Date.now()): string {
  let time = now;
  let stamp = '';
  for (let i = 0; i < 10; i++) {
    // charAt, not [] — indexing is `string | undefined` under noUncheckedIndexedAccess.
    stamp = CROCKFORD.charAt(time % 32) + stamp;
    time = Math.floor(time / 32);
  }
  // 256 is divisible by 32, so the modulo is unbiased.
  const random = [...randomBytes(16)].map((b) => CROCKFORD.charAt(b % 32)).join('');
  return `ws_${stamp}${random}`;
}
