/**
 * withWorkspace — THE ONLY DOOR TO TENANT DATA.
 * Read docs/WORKSPACE_ISOLATION.md §5 in full before changing one line of this file.
 *
 * Invariants (each one is a leak if broken):
 *   1. Always inside a transaction, so `SET LOCAL search_path` cannot survive
 *      back into the connection pool. Plain `SET` is banned — that single word
 *      is the difference between isolation and a silent cross-tenant leak.
 *   2. search_path is the workspace schema ONLY. `public` is NOT appended: with
 *      it on the path, a missing workspace table silently resolves to a shared one.
 *   3. Schema name is re-validated against the registry immediately before use
 *      and passed through identifier quoting. Never a template literal.
 *   4. The callback receives `tx`, never the pool. The raw client is unreachable.
 *   5. Nesting with a different workspace throws WORKSPACE_CONTEXT_CONFLICT.
 *   6. The active workspace is tracked per async call chain (AsyncLocalStorage),
 *      never in a module variable — Node serves many tenants' requests
 *      concurrently in one process, and a shared variable would let one request's
 *      scope bleed into another's.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { sql } from 'drizzle-orm';
import { AppError } from '@server/errors';
import { workspaceRoot } from '@server/db/client';
import type { SchemaName, WorkspaceId } from '@shared/types';
import type { WorkspaceContext } from './context';

/** The Drizzle transaction handle `workspaceRoot.transaction()` hands its callback. */
type WorkspaceDrizzleTx = Parameters<Parameters<typeof workspaceRoot.transaction>[0]>[0];

/**
 * Opaque handle to one workspace's data. Repositories accept ONLY this — never a pool
 * or a bare client. `db` is a Drizzle transaction whose `search_path` is pinned to
 * `schema`; workspace tables are declared unqualified (`pgTable('consent_event')`)
 * and resolve into that schema.
 */
export type WorkspaceTx = {
  readonly __brand: 'WorkspaceTx';
  readonly workspaceId: WorkspaceId;
  readonly schema: SchemaName;
  readonly db: WorkspaceDrizzleTx;
};

/**
 * Shape every provisioned schema name has (`ws_` + 26-char Crockford ULID). Mirrors
 * `SCHEMA_NAME_RE` in tooling/scripts/lib/db-migrations.ts, which mints them.
 */
const WORKSPACE_SCHEMA_PATTERN = /^ws_[0-9a-hjkmnp-tv-z]{26}$/;

/** Per-async-chain record of the workspace transaction currently open, if any. */
const activeScope = new AsyncLocalStorage<WorkspaceTx>();

function mintTx(ctx: WorkspaceContext, db: WorkspaceDrizzleTx): WorkspaceTx {
  return { __brand: 'WorkspaceTx', workspaceId: ctx.workspaceId, schema: ctx.schema, db };
}

/**
 * Invariant 3: the schema is looked up in the registry by workspace id, inside the
 * transaction, and must equal what the context claims. A context is minted only from
 * a validated session, but re-checking here is what makes a stale or tampered
 * context fail closed instead of pinning to the wrong schema.
 */
async function assertRegisteredSchema(ctx: WorkspaceContext, db: WorkspaceDrizzleTx) {
  if (!WORKSPACE_SCHEMA_PATTERN.test(ctx.schema)) {
    throw new AppError({
      code: 'WORKSPACE_NOT_FOUND',
      message: 'Schema name fails the workspace schema shape',
      context: { workspaceId: ctx.workspaceId },
    });
  }

  // `public.` is written explicitly: platform data is reached by an explicitly-scoped
  // accessor, never by relying on what happens to be on the search_path.
  const rows = await db.execute<{ schema_name: string }>(
    sql`select schema_name from public.workspace where id = ${ctx.workspaceId} limit 1`,
  );
  const registered = rows[0]?.schema_name;
  if (registered === undefined) {
    throw new AppError({
      code: 'WORKSPACE_NOT_FOUND',
      message: 'Workspace is not in the registry',
      context: { workspaceId: ctx.workspaceId },
    });
  }
  if (registered !== ctx.schema) {
    throw new AppError({
      code: 'WORKSPACE_ACCESS_DENIED',
      message: 'Context schema does not match the registry',
      context: { workspaceId: ctx.workspaceId },
    });
  }
}

/**
 * Runs `fn` inside a transaction pinned to exactly one workspace's schema. **The only
 * door to tenant data.**
 *
 * Guarantees: always a transaction (so `SET LOCAL search_path` cannot survive back into
 * the connection pool); `search_path` is the workspace schema only, never with `public`
 * appended; the schema name is validated against the registry and identifier-quoted; the
 * callback receives a scoped `tx`, never the pool; nesting with a different workspace
 * throws `WORKSPACE_CONTEXT_CONFLICT`. Nesting with the *same* workspace joins the open
 * transaction as a savepoint rather than opening a second connection.
 *
 * Read docs/WORKSPACE_ISOLATION.md §5 before changing one line of it.
 *
 * @param ctx Proof of an authorized workspace — see {@link WorkspaceContext}.
 * @param fn Receives the workspace-scoped transaction.
 */
export async function withWorkspace<T>(
  ctx: WorkspaceContext,
  fn: (tx: WorkspaceTx) => Promise<T>,
): Promise<T> {
  const outer = activeScope.getStore();

  if (outer !== undefined) {
    if (outer.workspaceId !== ctx.workspaceId) {
      throw new AppError({
        code: 'WORKSPACE_CONTEXT_CONFLICT',
        message: 'Nested withWorkspace() with a different workspace',
        context: { outer: outer.workspaceId, inner: ctx.workspaceId },
      });
    }
    // Same workspace: a savepoint on the already-pinned connection.
    return outer.db.transaction((inner) => fn(mintTx(ctx, inner)));
  }

  return workspaceRoot.transaction(async (drizzleTx) => {
    await assertRegisteredSchema(ctx, drizzleTx);
    // Invariant 1 + 2: SET LOCAL, tenant schema only. Invariant 3: identifier-quoted.
    await drizzleTx.execute(sql`set local search_path to ${sql.identifier(ctx.schema)}`);

    const tx = mintTx(ctx, drizzleTx);
    return activeScope.run(tx, () => fn(tx));
  });
}

/** Fails loudly rather than defaulting — an unscoped query must never "just work". */
export function assertWorkspaceScope(tx: WorkspaceTx | undefined): asserts tx is WorkspaceTx {
  if (!tx) {
    throw new AppError({
      code: 'WORKSPACE_CONTEXT_MISSING',
      message: 'Query attempted outside withWorkspace()',
    });
  }
}
