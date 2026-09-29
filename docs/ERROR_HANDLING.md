# Error Handling Pattern

**Status: FIXED. Not open to per-feature adjustment.**

This document defines the _only_ way errors are represented, propagated and surfaced
in this codebase. If a situation appears not to fit, that is a signal to raise an ADR
(`docs/adr/`) — not to invent a local variant. Local variants are how a codebase ends
up with six error shapes and no reliable way to alert on any of them.

Mechanically enforced by `local/error-handling-contract` in `eslint.config.mjs`.

---

## 1. The three kinds of failure

Every failure in the system is exactly one of these. Classify before you write code.

| Kind           | Meaning                                                                         | Who caused it  | Surfaced as                                                   |
| -------------- | ------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------- |
| **Expected**   | A modelled outcome. Validation failure, not-found, permission denied, conflict. | Caller         | Typed failure, returned — not thrown                          |
| **Unexpected** | A bug or a broken dependency. Null deref, DB down, timeout.                     | Us / infra     | Thrown `AppError`, logged at `error`, generic message to user |
| **Fatal**      | The process cannot continue safely. Missing env var, failed schema pin.         | Config / infra | Crash at boot. Do **not** degrade gracefully                  |

The most common mistake is treating an Expected failure as Unexpected — throwing for a
404 and catching it three layers up. Expected failures are part of a function's return
type. They are data.

## 2. `AppError` is the only throwable

```ts
throw new AppError({
  code: 'WORKSPACE_NOT_FOUND', // from @server/errors/codes — a closed union
  message: 'Workspace not found', // internal; never rendered verbatim to a user
  cause: err, // always chain, never discard
  context: { workspaceSlug }, // structured; redacted before logging
});
```

Rules:

- **Never** `throw new Error(...)`, `throw 'string'`, or throw a plain object.
- **Always** pass `cause`. A stack trace that stops at your rethrow is worthless.
- `code` comes from the closed union in `@server/errors/codes`. Adding a code is a
  deliberate act: it gets an HTTP status mapping and a user-facing message at the same time.
- `message` is for engineers. `userMessage` (derived from `code`) is for humans.
  Internal detail must never leak into a response body.

## 3. Expected failures use `Result`

```ts
import { type Result, ok, err } from '@shared/lib/result';

async function getInvoice(id: InvoiceId): Promise<Result<Invoice, 'NOT_FOUND' | 'FORBIDDEN'>> {
  const row = await repo.find(id);
  if (!row) return err('NOT_FOUND');
  if (!canRead(row)) return err('FORBIDDEN');
  return ok(row);
}
```

The caller cannot ignore the failure — the type forces a branch, and
`switch-exhaustiveness-check` forces every branch to be handled. This is the entire
point: exhaustiveness is checked at compile time, not discovered in production.

## 4. Catching

A `catch` block must do exactly one of:

1. **Recover** — a real fallback with a comment saying why it is safe.
2. **Translate and rethrow** — `throw toAppError(e, 'DB_QUERY_FAILED')`.
3. **Return a typed failure** — convert to `err(...)` at a boundary you own.

Never allowed: empty catch; `catch (e) { console.error(e) }` as the whole body;
catching without narrowing (`e` is `unknown` — use `toAppError`).
**Logging is not handling.**

## 5. Boundaries

There are exactly five places an error stops travelling:

| Boundary                    | File                        | Behaviour                                                                                                          |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Route handler               | `@server/errors/handler`    | `AppError` → status + `{ error: { code, message } }`. Unknown → 500 + generic body. Always logged with request id. |
| TanStack Query (client)     | `docs/TANSTACK_QUERY.md` §3 | Route Handler response parsed into a typed `ApiError`; surfaced via query/mutation `.error` state.                 |
| React Server Component tree | `src/app/**/error.tsx`      | Render the error template for routes still server-rendered (e.g. `(auth)`). Never a raw message.                   |
| React client tree           | `@organisms/ErrorBoundary`  | Same, plus a reset affordance. Catches render-time throws a query's own `.error` state doesn't.                    |
| Process                     | `instrumentation.ts`        | `unhandledRejection` / `uncaughtException` → log + exit non-zero.                                                  |

Everywhere else, errors propagate. Do not catch just because you are nervous.

## 6. What never appears in a user-facing response

Stack traces · SQL text or table names · file paths · env var values · internal ids of
other workspaces · upstream vendor error bodies · the word "undefined".

Response shape is always:

```json
{
  "error": {
    "code": "INVOICE_NOT_FOUND",
    "message": "That invoice does not exist.",
    "requestId": "01J..."
  }
}
```

`requestId` is the _only_ thing that ties a user report to a log line. It is mandatory.

## 7. Logging

Structured only, via `@shared/lib/logger`. `console.*` is lint-banned in `src/server/**`.
Log an error **once**, at the boundary that handles it — logging at every level produces
five entries for one failure and makes alert thresholds meaningless. Redact per
`docs/SECURITY_HYGIENE.md` §5 before logging any `context`.

---

**Related:** [ERROR_FIXING_PROTOCOL.md](./ERROR_FIXING_PROTOCOL.md) — how to _fix_ an
error once it happens. Read that one before touching failing code.
