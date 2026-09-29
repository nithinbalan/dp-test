/**
 * REAL-POSTGRES ISOLATION TEST SUITE — the one CI gate that proves the schema-per-
 * workspace invariant, not just withWorkspace()'s control flow.
 *
 * docs/WORKSPACE_ISOLATION.md §7 calls this suite "not optional" and requires it to
 * run against a real Postgres: with-workspace.test.ts (mocked) proves the function's
 * logic; this file proves the actual database behaves the way that logic assumes,
 * including under connection pooling — the one thing a mock cannot demonstrate.
 *
 * Needs DATABASE_URL (app role) and DATABASE_MIGRATION_URL (provisioning role) — see
 * .env.example. src/test/setup.ts loads .env.local for local runs; CI sets both
 * directly. Provisions two dedicated workspaces once, idempotently, and reuses them
 * on every run rather than tearing schemas down per run — cheap, and matches how the
 * product's own db:provision --repair is designed to behave against partial state.
 */
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { resolveWorkspaceContext } from '@server/auth';
import { generateSecureToken } from '@server/auth/crypto';
import { membership, platformTransaction, session, userAccount } from '@server/db';
import { rawClient, workspaceRoot } from '@server/db/client';
import { AppError } from '@server/errors';
import type { SchemaName, UserId, WorkspaceId } from '@shared/types';
import { isValidWorkspaceSlug } from '../context';
import type { WorkspaceContext } from '../context';
import { assertWorkspaceScope, withWorkspace } from '../with-workspace';

// Relative, not aliased: tooling/ has no path alias (ARCHITECTURE.md — it is
// enforcement machinery, not application code), and this suite deliberately reuses
// the same shared migration steps db:provision uses rather than reimplementing them,
// so a provisioned test workspace is provisioned exactly the way a real one is.
import {
  applyMigration,
  appRole,
  assertWorkspaceSchemaName,
  getAppliedChecksum,
  loadMigrationUrl,
  loadMigrations,
  newWorkspaceSchemaName,
} from '../../../../tooling/scripts/lib/db-migrations.ts';

const SLUG_A = 'isotest-a';
const SLUG_B = 'isotest-b';

/**
 * Registry row + schema + migrations + grants for one workspace, idempotently.
 * Mirrors tooling/scripts/provision.ts's four steps but is kept as its own function
 * (rather than importing provision.ts's CLI entrypoint) so this test suite can never
 * change production provisioning behaviour as a side effect of gaining a fixture.
 */
async function ensureWorkspace(
  migrationSql: postgres.Sql,
  slug: string,
  name: string,
): Promise<{ workspaceId: string; schemaName: string }> {
  const role = appRole();
  const migrations = (await loadMigrations()).filter((m) => m.scope === 'workspace');

  const existing = await migrationSql<{ id: string; schema_name: string }[]>`
    select id, schema_name from public.workspace where slug = ${slug}
  `;
  const found = existing[0];
  const schemaName = found?.schema_name ?? newWorkspaceSchemaName();
  assertWorkspaceSchemaName(schemaName, 'isolation.test.ts');

  if (!found) {
    await migrationSql`
      insert into public.workspace (slug, schema_name, legal_name, status, region)
      values (${slug}, ${schemaName}, ${name}, 'trial', 'ap-south-1')
    `;
  }

  const row = await migrationSql<{ id: string }[]>`
    select id from public.workspace where slug = ${slug}
  `;
  const workspaceId = row[0]?.id;
  if (!workspaceId) {
    throw new AppError({
      code: 'INTERNAL',
      message: `Registry row for "${slug}" vanished mid-provision.`,
    });
  }

  await migrationSql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  for (const migration of migrations) {
    if (await getAppliedChecksum(migrationSql, schemaName, migration.version)) continue;
    await applyMigration(migrationSql, migration, schemaName);
  }

  // Mirrors provision.ts's grantAppRole — kept separate so this suite never has to
  // import (and risk changing) the production provisioning script.
  const quotedSchema = `"${schemaName}"`;
  const grantee = `"${role}"`;
  await migrationSql.unsafe(`
    GRANT USAGE ON SCHEMA ${quotedSchema} TO ${grantee};
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${quotedSchema} TO ${grantee};
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${quotedSchema} TO ${grantee};
  `);

  return { workspaceId, schemaName };
}

let ctxA: WorkspaceContext;
let ctxB: WorkspaceContext;
let workspaceIdA: WorkspaceId;
let workspaceIdB: WorkspaceId;

beforeAll(async () => {
  const migrationSql = postgres(loadMigrationUrl(), { max: 1 });
  try {
    // Bring `public` to the current version too — a fresh CI database has no schema
    // at all until this runs; a developer's local database (already migrated) just
    // no-ops every step via getAppliedChecksum.
    const publicMigrations = (await loadMigrations()).filter((m) => m.scope === 'public');
    for (const migration of publicMigrations) {
      if (await getAppliedChecksum(migrationSql, 'public', migration.version)) continue;
      await applyMigration(migrationSql, migration, 'public');
    }

    const a = await ensureWorkspace(migrationSql, SLUG_A, 'Isolation Test A');
    const b = await ensureWorkspace(migrationSql, SLUG_B, 'Isolation Test B');
    workspaceIdA = a.workspaceId as WorkspaceId;
    workspaceIdB = b.workspaceId as WorkspaceId;

    const actorId = randomUUID() as UserId;
    ctxA = {
      workspaceId: workspaceIdA,
      schema: a.schemaName as SchemaName,
      actorId,
      role: 'owner',
    };
    ctxB = {
      workspaceId: workspaceIdB,
      schema: b.schemaName as SchemaName,
      actorId,
      role: 'owner',
    };

    // Deterministic starting point for the "identically-shaped rows" scenario below —
    // safe because these two workspaces exist only for this suite.
    await withWorkspace(ctxA, (tx) => tx.db.execute(sql`delete from department`));
    await withWorkspace(ctxB, (tx) => tx.db.execute(sql`delete from department`));
  } finally {
    await migrationSql.end({ timeout: 5 });
  }
}, 60_000);

afterAll(async () => {
  await rawClient.end({ timeout: 5 });
});

describe('workspace isolation (real Postgres)', () => {
  // 1 & 2. Seed workspaces A and B with identically-shaped rows; querying as A must
  // not see B's rows, by id — and vice versa.
  it("keeps workspace A blind to workspace B's rows, and vice versa, by id", async () => {
    const nameA = `dept-a-${randomUUID()}`;
    const nameB = `dept-b-${randomUUID()}`;

    const idA = await withWorkspace(ctxA, async (tx) => {
      const rows = await tx.db.execute<{ id: string }>(
        sql`insert into department (name) values (${nameA}) returning id`,
      );
      const id = rows[0]?.id;
      if (!id) throw new AppError({ code: 'INTERNAL', message: 'insert returned no id' });
      return id;
    });
    const idB = await withWorkspace(ctxB, async (tx) => {
      const rows = await tx.db.execute<{ id: string }>(
        sql`insert into department (name) values (${nameB}) returning id`,
      );
      const id = rows[0]?.id;
      if (!id) throw new AppError({ code: 'INTERNAL', message: 'insert returned no id' });
      return id;
    });

    const seenFromA = await withWorkspace(ctxA, (tx) =>
      tx.db.execute<{ id: string }>(sql`select id from department`),
    );
    const seenFromB = await withWorkspace(ctxB, (tx) =>
      tx.db.execute<{ id: string }>(sql`select id from department`),
    );
    const idsFromA = seenFromA.map((r) => r.id);
    const idsFromB = seenFromB.map((r) => r.id);

    expect(idsFromA).toContain(idA);
    expect(idsFromA).not.toContain(idB);
    expect(idsFromB).toContain(idB);
    expect(idsFromB).not.toContain(idA);
  });

  // 3. Reuse the same pooled connection for A then B, repeatedly — no bleed. Queries
  // Postgres itself (current_schema()) rather than trusting withWorkspace's own
  // bookkeeping, and alternates on the real shared pool from @server/db/client so a
  // handed-back connection is genuinely reused across tenants, not just simulated.
  it('does not bleed search_path across the shared connection pool under alternation', async () => {
    for (let i = 0; i < 20; i++) {
      const seenA = await withWorkspace(ctxA, (tx) =>
        tx.db.execute<{ name: string }>(sql`select current_schema() as name`),
      );
      expect(seenA[0]?.name).toBe(ctxA.schema);

      const seenB = await withWorkspace(ctxB, (tx) =>
        tx.db.execute<{ name: string }>(sql`select current_schema() as name`),
      );
      expect(seenB[0]?.name).toBe(ctxB.schema);
    }
  });

  // 4. A query outside withWorkspace() must throw, never silently use a default path.
  // workspaceRoot carries no schema, so a workspace table is simply not visible on
  // whatever search_path the connection happens to have.
  it('refuses a workspace-table query run outside withWorkspace() rather than defaulting', async () => {
    await expect(workspaceRoot.execute(sql`select 1 from department limit 1`)).rejects.toThrow();
  });

  it('assertWorkspaceScope throws rather than defaulting when no scope is active', () => {
    expect(() => {
      assertWorkspaceScope(undefined);
    }).toThrow(AppError);
  });

  // 5. Minting a WorkspaceContext for a workspace the session has no membership in
  // must be denied — exercised through the real auth service and a real session row,
  // not a hand-built context.
  it('denies resolveWorkspaceContext() for a workspace the session has no membership in', async () => {
    const email = `iso-${randomUUID()}@example.test`;
    const { rawToken, tokenHash } = generateSecureToken(32);

    await platformTransaction(async (tx) => {
      const inserted = await tx
        .insert(userAccount)
        .values({ email, fullName: 'Isolation Test User' })
        .returning({ id: userAccount.id });
      const user = inserted[0];
      if (!user) throw new AppError({ code: 'INTERNAL', message: 'user insert failed' });

      // Membership in workspace A only.
      await tx.insert(membership).values({
        workspaceId: workspaceIdA,
        userId: user.id,
        role: 'member',
        status: 'active',
        joinedAt: new Date(),
      });

      await tx.insert(session).values({
        userId: user.id,
        tokenHash,
        workspaceId: workspaceIdA,
        expiresAt: new Date(Date.now() + 60_000),
      });
    });

    // Requests workspace B's slug — the session has no membership there.
    await expect(resolveWorkspaceContext(rawToken, SLUG_B)).rejects.toMatchObject({
      code: 'WORKSPACE_ACCESS_DENIED',
    });

    // The same session resolves fine against the workspace it IS a member of.
    const resolved = await resolveWorkspaceContext(rawToken, SLUG_A);
    expect(resolved.workspaceId).toBe(workspaceIdA);
  });

  // 6. Nesting withWorkspace() with a different workspace must conflict, against a
  // real transaction — with-workspace.test.ts proves the same thing against a mock.
  it('throws WORKSPACE_CONTEXT_CONFLICT when nesting withWorkspace() with a different workspace', async () => {
    await expect(
      withWorkspace(ctxA, () => withWorkspace(ctxB, () => Promise.resolve('leak'))),
    ).rejects.toMatchObject({ code: 'WORKSPACE_CONTEXT_CONFLICT' });
  });

  // 7. A slug containing SQL metacharacters is rejected at validation, before it can
  // reach provisioning or a schema name.
  it('rejects a workspace slug with SQL metacharacters at validation', () => {
    expect(isValidWorkspaceSlug(`acme'; drop schema public cascade; --`)).toBe(false);
    expect(isValidWorkspaceSlug('acme"; select 1')).toBe(false);
    expect(isValidWorkspaceSlug(SLUG_A)).toBe(true);
  });
});
