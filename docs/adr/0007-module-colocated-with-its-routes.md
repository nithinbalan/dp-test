---
id: ADR-0007
title: A module lives beside its routes; DB access is gated by file role
status: accepted
date: 2026-09-11
affects:
  - src/app/api
  - src/server
  - tooling/eslint-rules
tags: [architecture, boundaries, tooling, isolation]
---

# ADR-0007: A module lives beside its routes; DB access is gated by file role

- **Status:** Accepted
- **Date:** 2026-09-11
- **Deciders:** @ajmalfaiz

## Context

A feature module used to be split across two trees: route handlers in
`src/app/api/<module>/**` and the domain code they call in `src/server/<module>/`. The
layering was right — route → service → repository → db — but the two halves shared only
a name, and the split cost more than it returned in daily work:

- Reading one endpoint end-to-end meant holding two locations in your head, in two
  different top-level trees.
- An agent told to "work on data-sources" had to be told twice where to look, and the
  route folder gave no signal that the logic lived elsewhere.
- `src/server/` had come to mean two unrelated things at once: cross-cutting
  infrastructure (`db`, `workspace`, `errors`) and feature domains (`auth`).

The counter-argument was that `src/app/**` is URL space — folder names there are route
segments — and that non-HTTP callers (`middleware.ts`, background jobs, server
components) would end up importing from URL-shaped paths. That cost is real and is
accepted below; it was judged smaller than the daily cost of the split.

The blocker was mechanical, not philosophical: `local/require-workspace-scope` granted
`@server/db` access by **directory** (`src/server/**`). Colocating would have forced that
allowlist to admit the whole route tree — handing `route.ts` the database access that
only a repository should have, and losing the guarantee the rule exists to provide.

## Decision

A feature module lives in one folder, `src/app/api/<module>/`, holding its `service.ts`,
`repository.ts`, supporting modules, tests, and its own route folders. It is reached as
`@api/<module>`.

`src/server/` now holds **only** cross-cutting infrastructure shared by every module —
`db`, `workspace`, `errors`. It is no longer where domains live.

`local/require-workspace-scope` now gates `@server/db` by **file role instead of
directory**: only a file named `repository.ts` may import it, wherever it sits. The raw
client (`@server/db/client`) remains restricted to the isolation layer by directory, and
the `sql.raw` ban is unchanged.

`extractDomains` discovers domains under both `src/server/*` and `src/app/api/*`, so a
colocated module still gets its generated, auto-loading `CLAUDE.md` and still appears in
`system/MAP.md`.

## Consequences

**Good:**

- One folder per module. Open `src/app/api/auth/` and the URL map and the logic are both
  there.
- The DB guard is strictly tighter than before. Under the directory rule, any file under
  `src/server/**` could import `@server/db` — `service.ts` included — and only discipline
  stopped it. Under the role rule, `service.ts` and `route.ts` are both refused even in
  the same folder as the repository. "The repository is the only door to data" is now
  enforced rather than intended.
- `src/server/` means exactly one thing: infrastructure every module shares.

**Bad / accepted costs:**

- Non-HTTP callers import from URL-shaped paths. A scan worker importing
  `@api/data-sources/...` reads oddly, since it is not reached over HTTP. Functionally
  fine, conceptually untidy, and permanent.
- Route folders and domain files sit at the same level inside a module. Folders are URL
  segments, files are code — legible, but it is a convention a newcomer must be told.
- Per WORKSPACE_ISOLATION.md §10 an isolation-rule change wants a second reviewer. This
  ADR records the change; the review is still owed.

**Now harder to change:**

- Extracting a module into a standalone service now cuts at `src/app/api/<module>/`
  rather than `src/server/<module>/`. ARCHITECTURE.md's scaling path is updated to match.

## Alternatives considered

| Option                                                      | Why not                                                                                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Keep `src/server/<module>/` (status quo)                    | The two-tree split was a real, daily mental-model cost, and the arguments for it were conceptual rather than felt.                                                                                                             |
| `service.ts` + `repository.ts` inside each **route** folder | Entities are shared across routes: `auth_challenge` is touched by 3 route folders, `session` by 5. "One repository per entity" and "per route folder" cannot both hold. And a `[id]/` folder has no noun to name a file after. |
| Colocate under a private `_lib/` subfolder                  | One more level of nesting for no gain once the lint rule keys on filename rather than directory.                                                                                                                               |
| Widen the lint allowlist to `src/app/api/**` by directory   | Would grant `route.ts` the same DB access as the repository. The filename rule gives colocation without that loss.                                                                                                             |

## Revisit when

A module needs to be called from enough non-HTTP entry points (workers, cron, other
modules) that importing from `@api/*` stops reading as an oddity and starts causing real
confusion about what is reachable from where. At that point the module has outgrown being
an API module and should move back under `src/server/`, which the lint rule already
permits without further change.
