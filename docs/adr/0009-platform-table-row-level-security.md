---
id: ADR-0009
title: Row-level security on platform tables — scoped to unused tables, not blanket
status: accepted
date: 2026-09-11
affects:
  - src/server/db
  - src/server/workspace
tags: [database, security, multi-tenancy, workspace-isolation]
---

# ADR-0009: Row-level security on platform tables — scoped to unused tables, not blanket

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

[docs/WORKSPACE_ISOLATION.md](../WORKSPACE_ISOLATION.md) §6 requires RLS "enabled on
`public` tables with policies keyed on the session's workspace — belt and braces for the
shared tables that schema separation does not cover." Six platform tables carry a
`workspace_id`: `workspace_domain`, `membership`, `session`, `subscription`, `invoice`,
`platform_audit_log`. Until this decision, none of them had RLS — the invariant was
documentation only.

Enabling RLS requires the request to tell Postgres who it is, since the app connects
through one shared low-privilege role (`app_user`) for every tenant — there is no
per-workspace Postgres role to key a policy on. That identity has to arrive as a session
GUC (`SET LOCAL`) set by application code before the query runs, the same mechanism
`withWorkspace()` already uses for `search_path`.

Two of the six tables cannot take that mechanism safely today:

- `membership` is read by `findSessionByTokenHash()` (src/server/auth/repository.ts) —
  the query that _establishes_ who the actor is, joined across every workspace the
  token's user belongs to. A policy keyed on a not-yet-known actor would return zero
  rows and silently break every authenticated request; a policy that defaults to "allow
  when the GUC is unset" is not a policy, since every current call site leaves it unset.
- `session` is looked up by an unguessable bearer token, not by an already-known actor.
  RLS models "which rows can this identity see," which doesn't fit a table whose entire
  access pattern is "prove you hold this specific secret."

Retrofitting a genuine per-request actor context through the platform data path
(mirroring `WorkspaceContext`/`withWorkspace` for `public`-schema access) is a real
design problem on its own — the login flow would need restructuring to carry that
context through `platformTransaction`. That is out of scope for closing this gap and
risks the one thing that currently works end-to-end (sign-in).

## Decision

Enable RLS with a GUC-keyed policy (`app.workspace_id`, `SET LOCAL` inside the same
transaction that opens `platformTransaction`) on the four tables no code path touches
yet: `workspace_domain`, `subscription`, `invoice`, `platform_audit_log`. The policy
**defaults to deny** when the GUC is unset — there is no permissive fallback, because a
permissive fallback on tables nothing queries today would just be theater. The first
module that reads any of these (billing, an audit-log viewer, custom-domain management)
must set `app.workspace_id` before it can see rows, which is exactly the forcing
function belt-and-braces defense is for.

`membership` and `session` do **not** get RLS in this change. This is deliberate, not
an oversight — see Context. Closing that gap requires a `PlatformContext` (an
actor-scoped equivalent of `WorkspaceContext`) threaded through the platform data path,
which is future work, not a fast-follow inside this decision.

See `db/schema/0004_platform_row_level_security.sql` for the implementation.

## Consequences

**Good:**

- Four of six workspace_id-bearing platform tables now fail closed on a missing scope,
  rather than being wide open.
- The pattern (`SET LOCAL app.workspace_id`, checked in the policy) mirrors
  `withWorkspace()`'s existing `search_path` mechanism, so it is not a new mental model.
- Because nothing queries these tables yet, this ships with zero behavior change and
  zero risk to the working login flow.

**Bad / accepted costs:**

- `membership` and `session` — the two platform tables actually read on every request —
  remain without a database-level backstop. Layers 1–5 of
  [docs/WORKSPACE_ISOLATION.md](../WORKSPACE_ISOLATION.md) §2 are the only protection
  for them until the PlatformContext work lands.
- A future author touching `workspace_domain`, `subscription`, `invoice`, or
  `platform_audit_log` must remember to `SET LOCAL app.workspace_id` — undocumented
  until that module's own CLAUDE.md exists. Flagged here so it isn't rediscovered as a
  mystery empty result set.

**Now harder to change:**

- Nothing — the four policies can be dropped or widened by a later migration without
  data impact, since no rows depend on the enforcement yet.

## Alternatives considered

| Option                                                                                    | Why not                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS on all six tables, permissive when the GUC is unset                                   | Every current call site leaves the GUC unset, so this provides zero real protection while looking done — worse than documenting the gap honestly.                             |
| RLS on all six tables, `membership`/`session` GUC set to the resolved user id post-lookup | The lookup query that resolves the user IS the query that needs `membership` rows across workspaces; there is no "post-lookup" moment before it runs.                         |
| Build the full `PlatformContext` threading now                                            | Real, valuable work, but out of scope for an audit-gap fix — it touches the only tested, working code path (sign-in) and deserves its own review, not a rider on this change. |
| Skip RLS entirely, rely on layers 1–5                                                     | Contradicts docs/WORKSPACE_ISOLATION.md §6's explicit "belt and braces" requirement, and was the audited gap this ADR closes.                                                 |

## Revisit when

A module starts reading `workspace_domain`, `subscription`, `invoice`, or
`platform_audit_log` — the GUC needs to actually be set at that call site, and this ADR
is where that author should find out why. Or: the `PlatformContext` design gets built
for another reason (e.g. a billing-admin surface needing "which workspaces can this
staff member see"), at which point `membership` and `session` should be revisited under
the same mechanism.
