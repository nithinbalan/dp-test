<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@api/auth`

> Auto-loaded when you work in `src/app/api/auth`. The block above the end marker is
> generated from source; edit the code, not this. Your own notes go below it.

## Public API

_No exported symbols yet._

## Decisions that constrain this code

- [ADR-0006](../../../../docs/adr/0006-spa-with-tanstack-query.md) — Client-rendered SPA on Next.js, TanStack Query as the data layer `accepted`
- [ADR-0007](../../../../docs/adr/0007-module-colocated-with-its-routes.md) — A module lives beside its routes; DB access is gated by file role `accepted`
- [ADR-0008](../../../../docs/adr/0008-auth-is-infrastructure.md) — Auth is infrastructure; route handlers share one ingress wrapper `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## Dependencies

Imports from: `@server/errors`, `@server/http`, `@server/workspace`

Server-only — a Route Handler module is never imported by a component. The browser reaches it over HTTP; see the route table in [system/MAP.md](../../../../docs/system/MAP.md).

## Rules that apply here

- Errors: [docs/ERROR_HANDLING.md](../../../../docs/ERROR_HANDLING.md) — `AppError` + `Result`, no local variants
- Data access: [docs/WORKSPACE_ISOLATION.md](../../../../docs/WORKSPACE_ISOLATION.md) — every query inside `withWorkspace()`
- On completion: [docs/SECURITY_HYGIENE.md](../../../../docs/SECURITY_HYGIENE.md) checklist
- Fixing a failure: [docs/ERROR_FIXING_PROTOCOL.md](../../../../docs/ERROR_FIXING_PROTOCOL.md) — read before editing

<!-- /GENERATED:domain -->

## What this domain is for

The HTTP surface of authentication: sign-in, sign-out, session, workspace switch, and
the three-step password recovery. **No logic lives here.** Every file is a `route.ts`
built on `defineRoute` from `@server/http`; each parses its body, calls `@server/auth`,
and shapes the response. The service, repository, crypto, cookies, and rate limiter are
in `src/server/auth/` ([ADR-0008](../../../../docs/adr/0008-auth-is-infrastructure.md)),
because middleware, the app layout, and every other module import them too.

**What a newcomer gets wrong.** Adding a rule here because it is "just for this
endpoint". A route is reachable by anything that can send HTTP, and the same rule will be
needed by the layout or the next module a week later — put it in the service. The other
mistake is returning `WorkspaceInfo` to the client: it carries `schemaName`, which the
browser has no business knowing. `toWorkspaceSummary` strips it; use it.
