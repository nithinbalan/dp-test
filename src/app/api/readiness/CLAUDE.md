<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@api/readiness`

> Auto-loaded when you work in `src/app/api/readiness`. The block above the end marker is
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

This is the Gap Assessment module (JDP-GAP): a guided questionnaire that scores how
ready the workspace is for the DPDP Act and produces a prioritized gap report. Ported
from the prototype's `gaCompute()`/`gaWzRender()`/`gaFinish()` — the scoring rules,
severity bands, and domain gating in `service.ts` are a line-by-line port of that mock,
not a fresh design.

A run is **append-only once completed** — `completeRun` never runs twice on the same
row. "Re-assess" (`reassess()`) always starts a brand-new run; it never edits history.
That's what a newcomer would get wrong: there is no "reopen and edit a finished
assessment" path, because the point is to keep a real record of read-only past attempts,
not a single mutable draft.

A question can be **gated out of scope** by the profile's yes/no answers (e.g. "no kids'
data processed" turns off the children's-data domain). Out-of-scope questions never
count toward the score, the "in progress" counters, or the gap list — see
`isQuestionActive`/`activeQuestionsFor` in both `service.ts` and the client hooks. Any
change to scoring or progress math has to filter through that gate first, or it will
count questions that shouldn't be in scope.
