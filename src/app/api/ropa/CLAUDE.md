<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@api/ropa`

> Auto-loaded when you work in `src/app/api/ropa`. The block above the end marker is
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

RoPA (Record of Processing Activities) is the DPDP-mandated register of every
processing activity a workspace runs — what data, whose, why, on what lawful
basis, for how long, and who owns it. It's the artifact a regulator or auditor
asks for first, so its statutory fields (lawful basis, retention, principal
type, cross-border transfer) are not free-form UI state — they map onto fixed
columns and enums that mirror the statute (see `mappings.ts`).

What a newcomer would get wrong:

- **Editing an approved activity does not keep it approved.** `updateActivity`
  always resets status to `needs_review` and bumps `version`, because any
  change to a statutory field invalidates the prior sign-off. There is no
  "patch without losing approval" path — that's intentional, not a bug to fix.
- **There's no separate reviewer role yet.** `approveActivity` records the
  activity's own owner as the approver. Don't assume a second-person
  four-eyes check exists in the data model — it isn't there.
- **Non-statutory detail lives in `custom` jsonb**, not its own columns
  (processors, recipients, systems, evidence, issues — see `ActivityCustom`
  in `service.ts`). Adding a new one of these is a jsonb shape change, not a
  migration, until it needs to be queried/filtered on its own.
