<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@server/workspace`

> Auto-loaded when you work in `src/server/workspace`. The block above the end marker is
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
- [ADR-0007](../../../docs/adr/0007-module-colocated-with-its-routes.md) — A module lives beside its routes; DB access is gated by file role `accepted`
- [ADR-0009](../../../docs/adr/0009-platform-table-row-level-security.md) — Row-level security on platform tables — scoped to unused tables, not blanket `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## Dependencies

Imports from: `@server/db`, `@server/errors`

Anything under `src/server/**` is server-only — never import it from a component.

## Rules that apply here

- Errors: [docs/ERROR_HANDLING.md](../../../docs/ERROR_HANDLING.md) — `AppError` + `Result`, no local variants
- Data access: [docs/WORKSPACE_ISOLATION.md](../../../docs/WORKSPACE_ISOLATION.md) — every query inside `withWorkspace()`
- On completion: [docs/SECURITY_HYGIENE.md](../../../docs/SECURITY_HYGIENE.md) checklist
- Fixing a failure: [docs/ERROR_FIXING_PROTOCOL.md](../../../docs/ERROR_FIXING_PROTOCOL.md) — read before editing

<!-- /GENERATED:domain -->

## What this domain is for

Turning an untrusted request into proof that exactly one workspace may be touched, and
then confining every query to it.

**The invariant:** a request executing for workspace A can never read or write a row
belonging to workspace B — by construction, not by discipline.

**What a newcomer gets wrong.** Schema-per-tenant _feels_ safe, and that is the danger.
A discriminator-column design fails loudly when you forget the filter — you see everyone's
data in dev immediately. This design fails _silently_: a pooled connection carrying a
stale `search_path` returns perfectly plausible wrong data, and nothing looks broken.
So the primary threat here is connection reuse, not SQL injection.

Three things people try that are wrong:

- `SET search_path` instead of `SET LOCAL` — the difference between isolation and a leak.
- Appending `public` to the search path — a missing workspace table then silently
  resolves to a shared one.
- Building a `WorkspaceContext` from a request value "just for a test" — the whole design
  rests on there being no constructor.

**Before changing anything here:** read `docs/WORKSPACE_ISOLATION.md` in full, and expect
an ADR plus a second reviewer. There is no temporary exception to isolation; temporary
exceptions are how the invariant dies.
