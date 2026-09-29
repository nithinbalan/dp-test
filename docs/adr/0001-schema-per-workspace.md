---
id: ADR-0001
title: Schema-per-workspace for tenant isolation
status: accepted
date: 2026-08-20
affects:
  - src/server/workspace
  - src/server/db
tags: [isolation, database, multi-tenancy, dpdp]
---

# ADR-0001: Schema-per-workspace for tenant isolation

- **Status:** Accepted
- **Date:** 2026-08-20

## Context

Multi-tenant application handling personal data under DPDP. Three options for isolation:
shared tables with a discriminator column, schema-per-tenant, or database-per-tenant.

Isolation failure is the highest-severity risk in the product. Enterprise buyers ask for
a demonstrable separation story. DPDP erasure requests need a per-tenant data boundary.

## Decision

One Postgres database, one schema per workspace (`ws_<ulid>`), shared/global tables in
`public`. All access through `withWorkspace()`, which pins `search_path` inside a
transaction. See `docs/WORKSPACE_ISOLATION.md`.

## Consequences

**Good:** no forgettable `WHERE workspace_id` filter; per-tenant export, backup and
erasure are natural; a clear isolation story; per-tenant tuning possible.

**Bad / accepted costs:** migrations run N times and need a resumable runner with drift
detection; connection pooling becomes the primary risk surface (a stale `search_path`
fails _silently_); schema count has a practical ceiling in the low thousands; some
tooling assumes a single schema.

**Now harder to change:** cross-workspace analytics needs a separate warehouse path.

## Alternatives considered

| Option               | Why not                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Discriminator column | One forgotten `WHERE` = a leak; hard to prove isolation to buyers; per-tenant erasure is a delete-scan |
| Database-per-tenant  | Strongest isolation, but connection and migration cost is prohibitive at our expected tenant count     |

## Revisit when

Workspace count approaches ~2,000, or migration wall-clock time exceeds the deploy window.
