<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@api/settings`

> Auto-loaded when you work in `src/app/api/settings`. The block above the end marker is
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

Who a workspace _is_, as data the rest of the platform can cite. The legal entity name,
the sector, the languages it publishes in and the published DPO contact all flow into
notices, Board filings and every generated document, so this module is the single place
they are written — not a settings blob each feature reads differently.

**The split that matters here.** Two tables carry a legal name and they are not the same
thing. `public.workspace` is the control plane: the registry row the session, the
workspace switcher and the topbar render, addressed only by the id a verified
`WorkspaceContext` carries. `workspace_profile` inside the `ws_*` schema is tenant data —
it travels with an export and is what the Act-facing documents quote. The service writes
the tenant row first and syncs the registry's display copy only after that transaction
commits, so a failure updating a convenience copy can never leave the real record
unsaved. Reading is the mirror image: before a workspace has ever saved, the registry
seeds the defaults so the panel opens on a real name instead of a blank field.

**What a newcomer gets wrong.**

- Adding a setting as a new column. `setting` (key/value jsonb) already exists precisely
  so the _catalog_ of toggles is code and the values are data — a new Configuration
  Studio switch must never need a migration. Only the fields the Act names get columns.
- Treating `publish_dpo_contact` as editable. s.8(9) requires the contact to be
  published; the UI renders it locked and the service never reads it from a request.
  Same for the base language — `en` survives an unselect, because a notice must remain
  readable in English.
- Pointing the DPO at the shared mock roster. The contact is an `employee` row in _this_
  workspace, validated before it is stored. The picker offering nobody is the correct
  state until the Employees module writes rows; offering fake people would hand it ids
  that could never be saved.
- Writing `sector_key` without checking it. There is no cross-schema FK to
  `public.sector` (see the db/schema/0002 header), so the allowlist in the service is the
  only thing standing between a dropdown and an arbitrary string in the column.
