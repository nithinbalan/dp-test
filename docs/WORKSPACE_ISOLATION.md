# Workspace Isolation (Schema-per-Tenant)

**"Workspace" and "tenant" are the same concept. The codebase says `workspace`
everywhere — one word, no synonyms.**

This is the single invariant the product cannot survive breaking:

> **A request executing in the context of workspace A can never read or write a row
> belonging to workspace B — and this must be true by construction, not by discipline.**

Everything below exists to move that guarantee out of developers' heads and into the
type system, the connection layer, the linter, and the database's own permissions.

---

## 1. Why schema-per-tenant, and what it does _not_ give you

One Postgres database. One schema per workspace (`ws_<ulid>`). Shared/global tables
(workspace registry, users, billing) live in `public`.

| Gives you                                                   | Does **not** give you                                     |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| Physical row separation — no `WHERE workspace_id` to forget | Protection from a wrong `search_path`                     |
| Per-workspace backup/restore/export (DPDP erasure)          | Protection from a connection reused across requests       |
| Cheap "prove isolation" story for enterprise buyers         | Protection from a raw SQL string with a schema name in it |
| Per-workspace index/vacuum tuning                           | Free schema migrations — every DDL runs N times           |

The right-hand column is the entire risk surface. **The danger of schema-per-tenant is
that it feels safe.** A discriminator-column design fails loudly when you forget the
filter (you see everyone's data in dev immediately). Schema-per-tenant fails _silently_:
a leaked connection with a stale `search_path` returns perfectly plausible wrong data.

Hence: pooled connections are the primary threat, not SQL injection.

## 2. The layers

```
 request
    │
    ▼
 [1] Workspace resolution ──── middleware.ts
    │      subdomain/header → slug → registry lookup → WorkspaceRef
    ▼
 [2] Session authorization ─── @server/auth
    │      does THIS user have a membership in THIS workspace? (deny by default)
    ▼
 [3] WorkspaceContext ──────── @server/workspace/context  (branded, unforgeable)
    │
    ▼
 [4] withWorkspace(ctx, fn) ── @server/workspace/with-workspace
    │      checkout connection → SET LOCAL search_path → run in tx → release
    ▼
 [5] Repository ────────────── <module>/repository.ts   (only tx-scoped queries)
    │
    ▼
 [6] Postgres RLS + role grants ── defence in depth, even if 1–5 are all wrong
```

Every layer assumes the ones above it are compromised. That is the design.

## 3. Layer 1 — resolution

- Strategy is config (`WORKSPACE_RESOLUTION_STRATEGY`): `subdomain` in production.
- The resolved slug is **untrusted input** until it has been looked up in the `public`
  registry and matched against the session's memberships.
- A slug never becomes a schema name by concatenation. The registry returns the schema
  identifier; slugs and schema names are separate columns and separate branded types.
- Reserved slugs (`www`, `api`, `admin`, `app`, `public`, `pg_*`) are rejected at
  creation time by an allowlist regex `^[a-z][a-z0-9-]{2,38}$`.

## 4. Layer 3 — `WorkspaceContext` is unforgeable

```ts
declare const brand: unique symbol;
export type WorkspaceId = string & { readonly [brand]: 'WorkspaceId' };

export type WorkspaceContext = {
  readonly workspaceId: WorkspaceId;
  readonly schema: SchemaName; // branded; only the registry can mint one
  readonly actorId: UserId;
  readonly role: WorkspaceRole;
};
```

There is **no public constructor**. A `WorkspaceContext` can only be produced by
`resolveWorkspaceContext()`, which requires an authenticated session. You cannot build
one from a string in a route handler, which means you cannot accidentally pass a
user-supplied id where a verified one is expected. This is the cheapest, highest-value
part of the whole design.

## 5. Layer 4 — `withWorkspace` is the only door

```ts
export async function withWorkspace<T>(
  ctx: WorkspaceContext,
  fn: (tx: WorkspaceTx) => Promise<T>,
): Promise<T>;
```

Non-negotiable properties:

1. **Always a transaction.** `SET LOCAL search_path` is scoped to the transaction, so it
   cannot survive back into the pool. `SET` (without `LOCAL`) is banned outright — that
   single word is the difference between isolation and a cross-tenant leak.
2. **`search_path` is set to the workspace schema only** — `public` is _not_ appended.
   Global tables are reached through an explicit, separately-scoped accessor. If
   `public` is on the path, a missing table in the workspace schema silently resolves to
   a shared one.
3. **Schema name is validated against the registry** immediately before use and passed
   through an identifier-quoting helper. It never arrives as a template-literal.
4. **`fn` receives `tx`**, never the pool. The raw client is not reachable from inside.
5. **No nesting with a different workspace.** Attempting it throws
   `WORKSPACE_CONTEXT_CONFLICT`. Cross-workspace work is an explicit, audited operation.
6. **Async context is not inherited across requests.** Never cache a `WorkspaceTx` in a
   module-level variable, a memo, or a React cache — Next.js reuses processes.

## 6. Layer 6 — the database does not trust the app

Even with layers 1–5 perfect, assume a bug. Therefore:

- The application role **cannot** `CREATE SCHEMA`, `DROP`, or read `pg_catalog` freely.
  Provisioning uses a separate migration role with different credentials
  (`DATABASE_MIGRATION_URL`), never available to request-handling code.
- The app role is granted `USAGE` on workspace schemas via a role-per-workspace grant
  where the deployment supports it.
- Row Level Security stays **enabled on `public` tables** with policies keyed on the
  session's workspace — belt and braces for the shared tables that schema separation
  does not cover.
- `default_transaction_read_only` on read replicas.

## 7. Enforcement (what actually stops a bad commit)

| Guard                                | Where            | Catches                                                                                                                             |
| ------------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `local/require-workspace-scope`      | ESLint, blocking | raw client imports outside the isolation layer; `@server/db` imported by anything that is not a `repository.ts`; `sql.raw`/`unsafe` |
| Branded `WorkspaceId` / `SchemaName` | tsc              | passing a user string where a verified id is required                                                                               |
| `withWorkspace` type signature       | tsc              | queries outside a scoped tx (repositories only accept `WorkspaceTx`)                                                                |
| Isolation test suite                 | CI, blocking     | see below                                                                                                                           |
| Migration runner                     | CI + deploy      | schema drift between workspaces                                                                                                     |
| PR checklist                         | review           | the human-judgement residue                                                                                                         |

### The isolation test suite is not optional

`src/server/workspace/__tests__/isolation.test.ts` must exist and must contain, at
minimum, tests that **fail if isolation breaks**:

1. Seed workspaces A and B with identically-shaped rows.
2. Query as A → B's rows are not visible, by count and by id.
3. Reuse the _same pooled connection_ for A then B → no bleed (the pooling test).
4. Attempt a query outside `withWorkspace` → throws, never silently uses a default path.
5. Attempt to mint a `WorkspaceContext` from a slug not in the session's memberships → denied.
6. Attempt `withWorkspace(A, () => withWorkspace(B, ...))` → `WORKSPACE_CONTEXT_CONFLICT`.
7. Provisioning a workspace whose slug contains SQL metacharacters → rejected at validation.

These run against a real Postgres in CI. Mocks cannot prove connection-level behaviour,
and connection-level behaviour is the actual risk.

## 8. Migrations and provisioning

```bash
pnpm db:provision --slug acme --name "Acme Private Limited"   # create a tenant
pnpm db:provision --repair acme                               # finish/repair one
pnpm db:migrate                                               # public + every schema
pnpm db:migrate --dry-run
pnpm db:status                                                # versions + drift; CI gate
```

- Migrations are versioned once and applied to **every** workspace schema plus `public`.
  Filename decides scope: `*platform*` → `public`, `*workspace*` → every tenant schema.
- **Provisioning is separate from migrating.** `db:provision` does four things —
  registry row, `CREATE SCHEMA`, every workspace migration, and the app-role GRANTs.
  `db:migrate` never creates a schema: doing so would skip the grants and leave a
  tenant the app cannot read despite a green migration run. A registry row whose
  schema is missing is reported and skipped, not silently created.
- The runner is transactional per schema, pins `search_path` to that schema **only**
  (§5 invariant 2 — never with `public` appended), records applied versions per schema,
  and is resumable: a failure at workspace 400 of 900 is safe to re-run.
- Editing an applied migration is a hard error — the ledger stores a sha256 of what was
  applied. Expand/contract only; write a new migration.
- `pnpm db:status` asserts **zero schema drift** and exits non-zero on: a schema behind
  the current version, a registry row with no schema, an orphan schema no row claims, or
  a schema the app role cannot `USAGE`. Drift between tenants is how "works for most
  customers" bugs are born.
- Expand/contract only: add nullable → backfill → switch reads → drop later. Never a
  destructive migration in the same deploy as the code that stops using the column.
- Adding a workspace and adding a column are the same problem at different scales — both
  go through the runner, never through a hand-run `psql`.

## 9. Beyond the database

Isolation is not only SQL. Every one of these carries a workspace key:

cache keys (`ws:<id>:...`) · queue jobs (payload carries `workspaceId`, worker rebuilds a
context and re-authorizes) · object storage prefixes · search indexes · rate limits ·
feature flags · analytics events · exports · webhooks · log correlation ids.

A background job is a request with no session. It must re-derive a `WorkspaceContext`
from stored data and re-check authorization — never trust the job payload's claims.

## 10. Changing anything in this document

Requires an ADR and a second reviewer. `eslint-disable` on `local/require-workspace-scope`
requires the same. There is no "temporary" exception to isolation; temporary exceptions
are how the invariant dies.
