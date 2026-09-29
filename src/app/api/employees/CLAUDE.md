<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@api/employees`

> Auto-loaded when you work in `src/app/api/employees`. The block above the end marker is
> generated from source; edit the code, not this. Your own notes go below it.

## Public API

_No exported symbols yet._

## Decisions that constrain this code

- [ADR-0006](../../../../docs/adr/0006-spa-with-tanstack-query.md) — Client-rendered SPA on Next.js, TanStack Query as the data layer `accepted`
- [ADR-0007](../../../../docs/adr/0007-module-colocated-with-its-routes.md) — A module lives beside its routes; DB access is gated by file role `accepted`
- [ADR-0008](../../../../docs/adr/0008-auth-is-infrastructure.md) — Auth is infrastructure; route handlers share one ingress wrapper `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## Dependencies

Imports from: `@server/auth`, `@server/db`, `@server/errors`, `@server/http`, `@server/workspace`

Server-only — a Route Handler module is never imported by a component. The browser reaches it over HTTP; see the route table in [system/MAP.md](../../../../docs/system/MAP.md).

## Rules that apply here

- Errors: [docs/ERROR_HANDLING.md](../../../../docs/ERROR_HANDLING.md) — `AppError` + `Result`, no local variants
- Data access: [docs/WORKSPACE_ISOLATION.md](../../../../docs/WORKSPACE_ISOLATION.md) — every query inside `withWorkspace()`
- On completion: [docs/SECURITY_HYGIENE.md](../../../../docs/SECURITY_HYGIENE.md) checklist
- Fixing a failure: [docs/ERROR_FIXING_PROTOCOL.md](../../../../docs/ERROR_FIXING_PROTOCOL.md) — read before editing

<!-- /GENERATED:domain -->

## What this domain is for

<!-- HUMAN-OWNED. Explain the WHY: the business problem, the invariants that are not
     obvious from the types, the decisions someone would otherwise re-litigate.
     Generated facts are above; this is the part only you can write.
     `pnpm ctx:check` fails while this still says TODO. -->

The people register behind s.7(i)/s.8(4): one row per employee, linking them to their
device's discovery agent and their DPDP awareness training. The Employees page answers
two questions from one row — "is their laptop scanned?" and "are they trained?" — so the
KPIs and the roster both read from this module rather than stitching Endpoints and
Academy state together in the UI.

**The split that matters here.** `createEmployee` only ever writes what this module owns:
name, work email, department, designation, and the `handlesPersonalData` flag. It does
NOT assign a device or an awareness course — `agentStatus` and `awarenessPercent` are
read-only aggregates joined in from `endpoint_device` and `enrollment` (owned by
Endpoints and Academy respectively). A new employee is created with `agentStatus:
'no-agent'` and `awarenessStatus: 'overdue'` on purpose; linking a device is Endpoints'
write path, not this one's.

**What a newcomer gets wrong.**

- Adding a `deviceId`/`agentStatus` field to the create form. There is nowhere to write
  it — `service.ts`'s `toAgentConnectionStatus` and `summariseAwareness` are read-only
  projections over another module's tables. Wanting to set them here is a sign the UI
  should link to Endpoints/Academy instead of faking a field this route can't persist.
- Awareness percent is a weighted average over MANDATORY courses only, and any single
  `overdue` mandatory enrollment forces the employee's overall status to `overdue`
  regardless of the average (see `summariseAwareness`'s doc comment) — it is a policy
  call, not something derivable from the schema, so don't "simplify" it to a plain mean.
- The human-facing employee code (`JTK/046`-style) is allocated from the same
  `ref_sequence`/`next_ref()` counter every other human-facing id in the workspace uses.
  Never invent a parallel counter or let the client submit its own code.
