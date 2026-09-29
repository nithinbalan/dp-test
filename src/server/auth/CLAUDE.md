<!-- GENERATED:domain — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# `@server/auth`

> Auto-loaded when you work in `src/server/auth`. The block above the end marker is
> generated from source; edit the code, not this. Your own notes go below it.

## Public API

| Symbol                     | Kind      | Layer   | Description                                                                             |
| -------------------------- | --------- | ------- | --------------------------------------------------------------------------------------- |
| `getSessionToken`          | Function  | module  | The raw session token carried by a request, if any. Unverified until `validateSession`. |
| `requestPasswordReset`     | Function  | module  | Initiates the password recovery flow by generating and dispatching a 6-digit OTP code.  |
| `resetPassword`            | Function  | module  | Resets password using a validated reset token, invalidating all sessions for the user.  |
| `resolveWorkspaceContext`  | Function  | module  | Validates the session token and mints the unforgeable WorkspaceContext                  |
| `SESSION_COOKIE_NAME`      | Variable  | module  | Name of the session cookie. Uses __Host- prefix in production with HTTPS.               |
| `SessionValidationSuccess` | TypeAlias | module  | Authenticated session validation outcome.                                               |
| `SignInInput`              | TypeAlias | module  | Credentials and context parameters for sign-in.                                         |
| `SignInSuccess`            | TypeAlias | module  | Successful sign-in outcome with session token and workspace context.                    |
| `signInWithPassword`       | Function  | service | Signs in with identifier (email or phone) and password, pinned to a workspace.          |
| `signOut`                  | Function  | service | Signs out by revoking the session.                                                      |
| `switchActiveWorkspace`    | Function  | service | Sets the workspace a session falls back to when the request host names none.            |
| `toWorkspaceSummary`       | Function  | service | The client-safe view of a workspace: everything but the schema name.                    |
| `UserProfile`              | TypeAlias | module  | Public user profile information.                                                        |
| `validateSession`          | Function  | service | Validates an incoming session token, returning the user and active workspace.           |
| `verifyResetCode`          | Function  | module  | Verifies a 6-digit recovery OTP code, returning a short-lived reset token on success.   |
| `WorkspaceInfo`            | TypeAlias | module  | Active workspace context and schema information.                                        |
| `WorkspaceSummary`         | TypeAlias | module  | Summary descriptor for an authorized workspace.                                         |

```ts
import {
  getSessionToken,
  requestPasswordReset,
  resetPassword,
  resolveWorkspaceContext,
} from '@server/auth';
```

## Decisions that constrain this code

- [ADR-0002](../../../docs/adr/0002-single-app-not-monorepo.md) — Single Next.js app, boundaries enforced by lint `accepted`
- [ADR-0007](../../../docs/adr/0007-module-colocated-with-its-routes.md) — A module lives beside its routes; DB access is gated by file role `accepted`
- [ADR-0008](../../../docs/adr/0008-auth-is-infrastructure.md) — Auth is infrastructure; route handlers share one ingress wrapper `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## Dependencies

Imports from: `@server/db`, `@server/errors`, `@server/workspace`

Anything under `src/server/**` is server-only — never import it from a component.

## Rules that apply here

- Errors: [docs/ERROR_HANDLING.md](../../../docs/ERROR_HANDLING.md) — `AppError` + `Result`, no local variants
- Data access: [docs/WORKSPACE_ISOLATION.md](../../../docs/WORKSPACE_ISOLATION.md) — every query inside `withWorkspace()`
- On completion: [docs/SECURITY_HYGIENE.md](../../../docs/SECURITY_HYGIENE.md) checklist
- Fixing a failure: [docs/ERROR_FIXING_PROTOCOL.md](../../../docs/ERROR_FIXING_PROTOCOL.md) — read before editing

<!-- /GENERATED:domain -->

## What this domain is for

Establishing who the actor is, and which workspaces they are a member of. It produces the
authenticated identity that `resolveWorkspaceContext()` requires; it does not itself decide
what the actor may do to a given record.

It is infrastructure, not a feature module ([ADR-0008](../../../docs/adr/0008-auth-is-infrastructure.md)):
middleware, the app layout, and every module's context resolution import it. Its HTTP
routes live under `src/app/api/auth/**` and import from here like any other caller.

**What a newcomer gets wrong.**

- Treating "is signed in" as authorization. Every check must be on the _object_ — can
  this actor act on this record, in this workspace — because a valid session for
  workspace A tells you nothing about a row in workspace B.
- Writing to the session during validation. The request **host** decides which workspace
  a request is in; `session.workspace_id` is only the fallback for a host that names none.
  A read that rewrites it makes two tabs on two subdomains fight over one row, and lets
  a request on one host change what the next request on another resolves to.
- Adding a query to the per-request path. `findSessionByTokenHash` is ONE joined query
  on purpose; it runs on every authenticated request.
- Calling several repository functions without a transaction when they must hold
  together. Pass the `tx` from `platformTransaction()` into each — the password reset is
  the worked example.

Deny by default: a new route is protected unless it explicitly opts out.
