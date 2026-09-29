<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@server/errors`

> Auto-loaded when you work in `src/server/errors`. The block above the end marker is
> generated from source; edit the code, not this. Your own notes go below it.

## Public API

| Symbol           | Kind      | Layer  | Description                                                                                 |
| ---------------- | --------- | ------ | ------------------------------------------------------------------------------------------- |
| `AppError`       | Class     | module | The only throwable in this codebase.                                                        |
| `AppErrorInit`   | TypeAlias | module | Construction shape for {@link AppError}.                                                    |
| `ERROR_CODES`    | Variable  | module | The closed error-code union. Adding a code is deliberate: it gets an HTTP                   |
| `ErrorCode`      | TypeAlias | module | Every failure the system can name. Closed on purpose: an error that is not in               |
| `errorResponse`  | Function  | module | Formats an error or error code into a standard JSON HTTP response with appropriate          |
| `isAppError`     | Variable  | module | Type guard for a caught `unknown`. Prefer {@link toAppError} unless you only need the test. |
| `statusFor`      | Variable  | module | HTTP status for a code. Used by the boundary handler; never chosen ad hoc.                  |
| `toAppError`     | Function  | module | Narrow an `unknown` catch binding into an AppError. This is the ONLY sanctioned             |
| `userMessageFor` | Variable  | module | The safe, human-facing message for a code. This — never `error.message` — is what           |

```ts
import { AppError, AppErrorInit, ERROR_CODES, ErrorCode } from '@server/errors';
```

## Decisions that constrain this code

- [ADR-0002](../../../docs/adr/0002-single-app-not-monorepo.md) — Single Next.js app, boundaries enforced by lint `accepted`
- [ADR-0007](../../../docs/adr/0007-module-colocated-with-its-routes.md) — A module lives beside its routes; DB access is gated by file role `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## Dependencies

Imports from no other domain.

Anything under `src/server/**` is server-only — never import it from a component.

## Rules that apply here

- Errors: [docs/ERROR_HANDLING.md](../../../docs/ERROR_HANDLING.md) — `AppError` + `Result`, no local variants
- Data access: [docs/WORKSPACE_ISOLATION.md](../../../docs/WORKSPACE_ISOLATION.md) — every query inside `withWorkspace()`
- On completion: [docs/SECURITY_HYGIENE.md](../../../docs/SECURITY_HYGIENE.md) checklist
- Fixing a failure: [docs/ERROR_FIXING_PROTOCOL.md](../../../docs/ERROR_FIXING_PROTOCOL.md) — read before editing

<!-- /GENERATED:domain -->

## What this domain is for

Making every failure classifiable, so a boundary can respond correctly without reading
message text, and so an alert can count something meaningful.

**Why it is closed.** `ErrorCode` is a fixed union and `AppError` is the only throwable.
That looks bureaucratic until you have forty domains: at that point ad-hoc errors mean
every boundary guesses at a status, user-facing copy drifts per feature, and no dashboard
can distinguish "the database is down" from "someone typed a bad email".

**What a newcomer gets wrong.** Reaching for `throw` on an _expected_ outcome — a
not-found, a permission denial. Those are modelled results, not exceptions: they belong in
the return type as `Result`, where the compiler forces every caller to handle them.
Throwing for a 404 discards that guarantee and turns a typed branch into a runtime search.

Adding a code is deliberate: it gets a status and user-facing copy in the same edit, in
`codes.ts`. That coupling is the point — it is what stops internal detail leaking.
