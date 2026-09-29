<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@api/departments`

> Auto-loaded when you work in `src/app/api/departments`. The block above the end marker is
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

The shared list of department names a workspace picks from — one list, read by
Configuration Studio's "Department" panel and by the Employees "Add employee" form's
Department dropdown, so a department is only ever typed once instead of being
free-typed inconsistently in each place.

**What a newcomer gets wrong.**

- Assuming `employees`' own `findDepartmentByName`/`insertDepartment` (in
  `src/app/api/employees/repository.ts`) is duplicate code to delete. It isn't — each
  module owns its own queries against the shared `department` table, per this
  codebase's role-based (not location-based) data-access convention. Importing one
  module's repository from another's route/service is the thing to avoid, not the
  duplication itself.
- Treating a department name as globally unique across workspaces. `department.name` is
  UNIQUE only within its own workspace schema (schema-per-tenant isolation); two
  different workspaces can both have a "Development" department with no conflict.
