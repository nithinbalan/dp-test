<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@server/http`

> Auto-loaded when you work in `src/server/http`. The block above the end marker is
> generated from source; edit the code, not this. Your own notes go below it.

## Public API

| Symbol          | Kind      | Layer  | Description                                                                             |
| --------------- | --------- | ------ | --------------------------------------------------------------------------------------- |
| `dataResponse`  | Function  | module | The standard success envelope: `{ data }`.                                              |
| `defineRoute`   | Function  | module | Wraps a route body with the ingress/egress plumbing described above. The returned       |
| `parseJsonBody` | Function  | module | Reads and validates a JSON body. A body that is not JSON, or does not match the         |
| `RouteContext`  | TypeAlias | module | What a route body receives. `params` is Next's dynamic-segment promise, passed through. |

```ts
import { dataResponse, defineRoute, parseJsonBody, RouteContext } from '@server/http';
```

## Decisions that constrain this code

- [ADR-0002](../../../docs/adr/0002-single-app-not-monorepo.md) — Single Next.js app, boundaries enforced by lint `accepted`
- [ADR-0007](../../../docs/adr/0007-module-colocated-with-its-routes.md) — A module lives beside its routes; DB access is gated by file role `accepted`
- [ADR-0008](../../../docs/adr/0008-auth-is-infrastructure.md) — Auth is infrastructure; route handlers share one ingress wrapper `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## Dependencies

Imports from: `@server/errors`

Anything under `src/server/**` is server-only — never import it from a component.

## Rules that apply here

- Errors: [docs/ERROR_HANDLING.md](../../../docs/ERROR_HANDLING.md) — `AppError` + `Result`, no local variants
- Data access: [docs/WORKSPACE_ISOLATION.md](../../../docs/WORKSPACE_ISOLATION.md) — every query inside `withWorkspace()`
- On completion: [docs/SECURITY_HYGIENE.md](../../../docs/SECURITY_HYGIENE.md) checklist
- Fixing a failure: [docs/ERROR_FIXING_PROTOCOL.md](../../../docs/ERROR_FIXING_PROTOCOL.md) — read before editing

<!-- /GENERATED:domain -->

## What this domain is for

The one shape every Route Handler has. `defineRoute` owns what is identical for every
endpoint — a request id minted at ingress and echoed on every response, the catch-all
that turns a thrown `AppError` into the standard error body, and body parsing that makes
malformed JSON a 400 rather than a 500 — so a route file contains only what is specific to
that route: parse, call a service, shape the response.

**What a newcomer gets wrong.** Exporting a bare `async function POST`. It works, and it
silently has no request id and no boundary, so the first unexpected throw is a Next.js
500 page with nothing in the logs to trace it by. There is no reason to skip the wrapper;
if it cannot express what a route needs, extend it here.

Business logic does not belong in a route, wrapped or not. A route that contains an `if`
about domain state is a service that lost its way.
