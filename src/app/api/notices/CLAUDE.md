<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@api/notices`

> Auto-loaded when you work in `src/app/api/notices`. The block above the end marker is
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

Generates and manages the privacy notices s.5 and Rule 3 of the DPDP Act require —
drafting one from a linked RoPA processing activity or from free text, then tracking
draft/published versions and per-section content through to publication.

What a newcomer gets wrong: "Jethur AI drafts it" is not an LLM call — `templates.ts`
is a deterministic template fill (mirroring the prototype's own `ntFromRopa`/`ntFromText`
JS), so don't go looking for a model client or prompt here, and don't wire one in without
first checking whether the deterministic approach was a deliberate scope decision. Also,
only `notice`, `notice_version`, and `notice_section` are persisted (the "core slice");
`notice_language`, `notice_checklist`, and `notice_publication` exist in the schema but
are deliberately computed/derived rather than written to — check that decision still
holds before assuming those tables should be populated.
