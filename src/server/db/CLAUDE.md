<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@server/db`

> Auto-loaded when you work in `src/server/db`. The block above the end marker is
> generated from source; edit the code, not this. Your own notes go below it.

## ⚠ Isolation layer

This domain is part of the workspace isolation boundary. Read
[docs/WORKSPACE_ISOLATION.md](../../../docs/WORKSPACE_ISOLATION.md) **in full** before
changing anything here. `local/require-workspace-scope` restricts who may import it,
and changing that rule requires an ADR.

## Public API

_No exported symbols yet._

## Decisions that constrain this code

- [ADR-0001](../../../docs/adr/0001-schema-per-workspace.md) — Schema-per-workspace for tenant isolation `accepted`
- [ADR-0002](../../../docs/adr/0002-single-app-not-monorepo.md) — Single Next.js app, boundaries enforced by lint `accepted`
- [ADR-0005](../../../docs/adr/0005-dynamic-fields-typed-columns-plus-jsonb.md) — Dynamic form fields — typed columns for statutory data, jsonb for custom `accepted`
- [ADR-0007](../../../docs/adr/0007-module-colocated-with-its-routes.md) — A module lives beside its routes; DB access is gated by file role `accepted`
- [ADR-0009](../../../docs/adr/0009-platform-table-row-level-security.md) — Row-level security on platform tables — scoped to unused tables, not blanket `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## Dependencies

Imports from no other domain.

Anything under `src/server/**` is server-only — never import it from a component.

## Rules that apply here

- Errors: [docs/ERROR_HANDLING.md](../../../docs/ERROR_HANDLING.md) — `AppError` + `Result`, no local variants
- Data access: [docs/WORKSPACE_ISOLATION.md](../../../docs/WORKSPACE_ISOLATION.md) — every query inside `withWorkspace()`
- On completion: [docs/SECURITY_HYGIENE.md](../../../docs/SECURITY_HYGIENE.md) checklist
- Fixing a failure: [docs/ERROR_FIXING_PROTOCOL.md](../../../docs/ERROR_FIXING_PROTOCOL.md) — read before editing

<!-- /GENERATED:domain -->

## What this domain is for

Owning the raw Postgres connection, and being the only place that is allowed to.

**What a newcomer gets wrong.** Importing the client "just to run one quick read".
`local/require-workspace-scope` blocks it, and the rule is not bureaucracy: a query
outside `withWorkspace()` runs on whatever `search_path` the pooled connection last had.
That is not an error — it is a successful query against the wrong tenant.

The app role is deliberately low-privilege and cannot `CREATE SCHEMA` or `DROP`.
Provisioning uses `DATABASE_MIGRATION_URL` with a different role that request-handling
code never has. If you find yourself needing more privilege in a request path, the design
is wrong, not the grant.

Migrations run per-schema through a resumable runner — never a hand-run `psql` against one
tenant, which is how schema drift between customers starts.
