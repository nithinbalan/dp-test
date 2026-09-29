---
id: ADR-0008
title: Auth is infrastructure; route handlers share one ingress wrapper
status: accepted
date: 2026-09-11
affects:
  - src/server/auth
  - src/server/http
  - src/app/api
  - src/middleware.ts
tags: [architecture, boundaries, auth, isolation]
---

# ADR-0008: Auth is infrastructure; route handlers share one ingress wrapper

- **Status:** Accepted (amends [ADR-0007](./0007-module-colocated-with-its-routes.md) for
  one module; does not supersede it)
- **Date:** 2026-09-11
- **Deciders:** @ajmalfaiz

## Context

ADR-0007 put a feature module beside its routes under `src/app/api/<module>/` and
reserved `src/server/` for infrastructure every module shares. It also named the condition
under which a module should move back: when it is called from enough non-HTTP entry points
that importing it from a URL-shaped path stops being an oddity.

Auth met that condition on day one. `src/middleware.ts` imported its cookie name;
`src/app/(app)/layout.tsx` (a Server Component) imported `validateSession`; and
`src/server/workspace/context.ts` — infrastructure — documented that its only legitimate
producer was `resolveWorkspaceContext`, which lived in the feature tree. Every future
module will import that resolver to mint a `WorkspaceContext`. The dependency arrow
pointed from infrastructure to a feature, which is backwards.

Two smaller problems compounded it. `@api/auth/index.ts` barrel-exported everything —
crypto, the rate limiter, the notification provider — so internals were public API, and
route files imported `'../index'` to reach their own module's helpers. And each of the
seven route handlers repeated the same try/parse/call/shape/catch block, with no
request id on success responses and malformed JSON surfacing as a 500.

## Decision

1. **Auth lives in `src/server/auth/`.** Service, repository, crypto, cookies, rate
   limiting, the notification provider, the context resolver, and their tests. It is
   imported as `@server/auth`. The HTTP routes stay under `src/app/api/auth/**/route.ts`
   and import from `@server/auth` like any other caller.

2. **The `@server/auth` barrel is curated.** It exports what callers outside the module
   need — session validation, the flows, cookie name/getter, the context resolver, the
   client-safe `toWorkspaceSummary` — and nothing else. Crypto, rate limiting, the IP
   helper, and notifications are reached by explicit sub-path when a route genuinely
   needs them (`@server/auth/rate-limit`), which keeps that need visible in the import.

3. **`src/server/http/` holds `defineRoute`.** Every Route Handler is
   `export const POST = defineRoute(async ({ request, requestId }) => …)`. The wrapper
   mints (or adopts, from a trusted proxy) a request id, echoes it as `X-Request-Id` on
   every response, threads it into `errorResponse`, and is the one catch-all boundary.
   `parseJsonBody` turns malformed JSON and schema failures into `VALIDATION_FAILED`
   (400) as a `Result`, never a thrown exception.

4. **Session validation is read-only.** The request host is the single source of truth
   for which workspace a request is in. `session.workspace_id` is a fallback used only
   when the host names no workspace; it is set at sign-in and by the explicit switch
   endpoint, and never rewritten by a read.

5. **Repositories take an executor.** Every repository function's last parameter is a
   `PlatformExecutor` defaulting to the pool, and `platformTransaction(fn)` hands a
   service one to pass through, so multi-statement flows (password reset: new hash,
   consume token, revoke sessions) commit or fail together. `withWorkspace()` follows the
   same shape for tenant data.

The rule for what belongs in `src/server/` is unchanged and now has a worked example:
**infrastructure is what more than one module, or a non-HTTP entry point, must import.**
Auth qualifies. A feature such as `data-sources` does not, and stays under
`src/app/api/`.

## Consequences

**Good:**

- The dependency arrow is correct: `src/server/workspace` → `src/server/auth` →
  `src/server/db`, all infrastructure. No `src/server/**` file imports from `src/app/**`.
- Middleware and Server Components import auth from an infrastructure path, which is
  what they are doing.
- Route files are a third of their former length and cannot diverge in the plumbing.
- A request id exists for every request, not only failed ones.

**Bad / accepted costs:**

- Auth is the one module whose code and routes are in different trees — precisely the
  split ADR-0007 removed for feature modules. Accepted because auth's callers are mostly
  not its routes.
- `src/server/` now contains something with business rules (password policy, workspace
  selection). The line is "shared by every module", not "has no logic".

## Alternatives considered

| Option                                                                | Why not                                                                                                                                  |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Keep auth under `src/app/api/auth/`, move only the resolver + cookies | Splits one repository's tables across two modules and leaves `validateSession` — the thing layouts and middleware need — in the feature. |
| Keep everything in place; accept the inverted arrow                   | The arrow is the thing ADR-0007 said to watch for; ignoring its own trigger makes the ADR decorative.                                    |
| Per-route boilerplate, no wrapper                                     | Seven copies at one module; the divergence cost is paid at the second module, when it is already too late to be cheap.                   |

## Revisit when

A second module turns out to be imported by middleware, layouts, or workers. If that
becomes common, the real fix is a `src/server/<module>/` convention with the routes
elsewhere for every module — i.e. reversing ADR-0007 — not a growing list of exceptions.
