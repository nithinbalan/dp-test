# Architecture

## Shape

Single Next.js 15 application (App Router), one Postgres database with one schema per
workspace, deployed as one unit. Deliberately not a monorepo or a service mesh yet — see
`adr/0002`. The boundaries that matter are enforced _inside_ the repo by lint and types,
which gives most of the discipline of separate packages without the coordination cost.

```
src/
├── app/                 # routes only: fetch, resolve workspace, compose a template
│   ├── (marketing)/     # public
│   ├── (app)/           # authenticated, workspace-scoped
│   └── api/<module>/    # a module: service, repository, tests AND its route folders
├── components/
│   ├── atoms/ molecules/ organisms/ templates/     # one-way deps, lint-enforced
├── server/              # cross-cutting infrastructure ONLY — not where modules live
│   ├── db/              # drizzle client + schema defs   (isolation layer)
│   ├── workspace/       # resolution, context, withWorkspace  (isolation layer)
│   └── errors/          # AppError, codes, boundary handler
├── shared/              # tier-neutral, importable anywhere
│   ├── types/ hooks/ lib/ config/
└── styles/
design-system/           # tokens + generated component manifest
tooling/                 # eslint rules, scripts — the enforcement machinery
docs/                    # the rules; read before writing code
```

## Layering (server)

```
route handler  →  service (domain logic, authz)  →  repository (WorkspaceTx only)  →  db
```

All four live in the same module folder — see **Where a module lives** below.

- **Route handler**: `export const POST = defineRoute(async ({ request, requestId }) => …)`
  from `@server/http`. Parse input with `parseJsonBody`, resolve `WorkspaceContext`, call
  a service, map the result to a response via `dataResponse`/`errorResponse`. No business
  logic. The wrapper owns the request id and the catch-all boundary. The only entry
  point — Server Actions are not used (ADR-0006).
- **Service**: domain rules and authorization decisions. Returns `Result` for expected
  failures. Knows nothing about HTTP. Composes repository calls atomically by opening a
  transaction and passing its executor through.
- **Repository**: queries only. Accepts a `WorkspaceTx` (tenant data) or a
  `PlatformExecutor` as its last parameter (platform data), never opens its own
  connection. No business logic — a repository with an `if` about domain state is a
  service.

Each layer is testable without the one above it. That is the point of the split.

## Where a module lives

**One module, one folder** ([ADR-0007](./adr/0007-module-colocated-with-its-routes.md)).
`src/app/api/<module>/` holds the whole thing — `service.ts`, `repository.ts`, supporting
modules, tests, and its own route folders. It is imported as `@api/<module>`.

```
src/app/api/consent/       ← the module
├── service.ts             business rules, authz, orchestration
├── repository.ts          every query; the only file that may import @server/db
├── index.ts               public barrel
├── __tests__/
├── route.ts               ← URL: GET/POST /api/consent
└── [id]/
    └── withdraw/route.ts  ← URL: POST /api/consent/:id/withdraw
```

**Read it this way: folders are URL segments, files are code.** `[id]/` exists because
the path has one; `service.ts` exists because the module needs one. That is the one
convention this layout asks you to hold.

`src/server/` is **not** where feature modules live. It holds only the cross-cutting
infrastructure every module shares — `db`, `workspace`, `errors`, `http`, and `auth`
([ADR-0008](./adr/0008-auth-is-infrastructure.md): auth is imported by middleware,
layouts, and every module's context resolution, so it is infrastructure; its HTTP routes
still sit under `src/app/api/auth/**`). If you are about to create `src/server/<feature>/`
and the answer to "does more than one module, or a non-HTTP caller, import this?" is no,
you want `src/app/api/<feature>/` instead.

| Concern                                           | Lives in                                      |
| ------------------------------------------------- | --------------------------------------------- |
| URL shape, status codes, cookies, request parsing | `src/app/api/<module>/**/route.ts`            |
| Business rules, authorization, orchestration      | `src/app/api/<module>/service.ts`             |
| Queries — one per entity, no domain `if`s         | `src/app/api/<module>/repository.ts`          |
| Infrastructure every module shares                | `src/server/{db,workspace,errors,http,auth}/` |

`local/require-workspace-scope` gates data access by **file role, not location**: only a
file named `repository.ts` may import `@server/db`. `service.ts` and `route.ts` are
refused even sitting in the same folder — so the repository really is the only door to
data, rather than merely being the intended one.

## Adding a backend module

`<module>` is the singular domain noun: `consent`, not `consents` or `consent-api`.

```
src/app/api/<module>/
├── service.ts      business rules, authz, orchestration; returns Result
├── repository.ts   queries only; the ONLY file that imports @server/db
├── index.ts        public barrel — exports the service, never the repository
├── __tests__/
└── <action>/route.ts   one thin adapter per endpoint
```

1. `pnpm ctx:find "<what you are about to build>"`. The answer is often "extend the
   existing module" — a second one built in ignorance is the expensive mistake here.
2. Write `repository.ts`, then `service.ts`. Keep the split honest: a repository with an
   `if` about domain state is a service; a service that needs `@server/db` is a repository
   that lost its way — and the linter will say so.
3. Write the route handler: parse with Zod, call the service, shape the response. If it
   contains a business rule, it is in the wrong file.
4. `pnpm ctx` — scaffolds the module's `CLAUDE.md`. Replace the `TODO` with the WHY and
   TSDoc every export; `ctx:check` fails until both are done.
5. `pnpm verify`, then the [SECURITY_HYGIENE.md](./SECURITY_HYGIENE.md) checklist.

Barrel discipline carries more weight than it looks: an `index.ts` that exports the
repository lets any caller skip the service — and skipping the service skips the
authorization checks that only live there.

**When a module outgrows one `service.ts`,** split by entity rather than by URL —
`sources/`, `scanning/`, `findings/`, each with its own service and repository. Splitting
per route folder does not work: entities are shared across endpoints, and a `[id]/`
folder has no noun to name a file after.

## Path aliases

Configured in `tsconfig.json` so that reaching for shared code is _easier_ than writing a
local alternative — the ergonomic gradient has to point toward reuse, or people write
their own `formatDate` every time.

`@/*` `@app/*` `@api/*` `@atoms/*` `@molecules/*` `@organisms/*` `@templates/*`
`@shared/*` `@server/*` `@styles/*` `@design-system/*`

Deep relative imports (`../../../shared/lib`) are a smell: either use the alias, or the
file is in the wrong place.

## Rendering

Client-rendered SPA under `src/app/(app)/**` ([ADR-0006](./adr/0006-spa-with-tanstack-query.md)).
`'use client'` is the default there, not an opt-in — Next.js is the framework for both
the SPA shell and the API; there is no separate backend. Route Handlers under
`src/app/api/**` are the only data-access surface and are treated as public HTTP
endpoints that authorize independently, exactly as Server Actions did before. Data
fetching and mutation go through TanStack Query — see
[TANSTACK_QUERY.md](./TANSTACK_QUERY.md). Pages still resolve the workspace and compose
the template; the fetch itself happens in query hooks colocated per domain, not inline
in the page. `(auth)` and any future public route groups are out of scope for this
decision — they keep whatever rendering already serves them.

## State

| Kind          | Where                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| Server data   | TanStack Query, calling Route Handlers under `src/app/api/**` (`TANSTACK_QUERY.md`) |
| URL state     | search params — shareable, back-button-correct, and part of the query key           |
| Local UI      | `useState` in the lowest component that needs it                                    |
| Cross-tree UI | context, one per concern, defined at the organism tier or above                     |

No global client store until there is a concrete need an ADR can describe.

## Scaling path (deliberately deferred)

Written down so nobody "prepares" for it prematurely:

1. Read replicas → routing in `withWorkspace` only. No app-code change.
2. Workspace sharding → registry already maps workspace → schema; extend to → cluster.
3. Extracting a service → the `app/api/<module>` folder is where it cuts.
4. Monorepo → `design-system/` and `shared/` are the first packages out.

Each is possible because of a boundary that exists today. None is built today.
