---
id: ADR-0006
title: Client-rendered SPA on Next.js, TanStack Query as the data layer
status: accepted
date: 2026-09-02
affects:
  - src/app
  - src/components
  - src/shared
tags: [architecture, rendering, data-fetching]
---

# ADR-0006: Client-rendered SPA on Next.js, TanStack Query as the data layer

- **Status:** Accepted
- **Date:** 2026-09-02
- **Deciders:** ajmalfaiz

## Context

Jethur is an internal admin panel, not a public/indexable surface — SEO has no value
here. It is also going to grow into a large number of interactive, data-dense screens
(tables, filters, mutations across many domains). The RSC-per-navigation model in
ADR-0002-era `ARCHITECTURE.md` ("Server Components by default... data fetching happens
in the page tier") means every navigation is a server round trip, and gives up
client-side caching, dedup, and mutation ergonomics that this kind of app leans on
constantly. Server Actions as the mutation mechanism don't fit a client cache/invalidate
model cleanly either.

The alternative considered was ejecting to a framework-free SPA (Vite + a router,
separate backend). Rejected: it throws away the workspace isolation enforcement
(`local/require-workspace-scope`, `withWorkspace`), the `AppError`/`Result` error
contract, and the i18n plumbing that already work, for no gain — Next.js Route Handlers
already give a client-rendered app the fast, no-SSR-round-trip navigation this decision
is actually after.

## Decision

The authenticated app (`src/app/(app)/**`) is a client-rendered SPA. Next.js remains the
framework for both halves:

- **Frontend**: Client Components by default under `src/app/(app)/**`. Next.js's router
  still owns URL/route matching; there is no separate router library.
- **Backend**: Route Handlers under `src/app/api/**` are the _only_ data-access surface.
  Server Actions are no longer used for mutations. Everything below the route
  (`service → repository → db`, `withWorkspace`, `AppError`/`Result`) is unchanged — a
  Route Handler calls a service exactly the way a Server Action did.
- **Data layer**: TanStack Query is the exclusive client mechanism for fetching and
  mutating server data. See `docs/TANSTACK_QUERY.md` for the rules that make this
  efficient rather than just "installed."

`(auth)` (and any future `(marketing)`-style public routes) are unaffected — they keep
whatever rendering already serves them; this decision scopes to the authenticated app
shell, where SEO doesn't matter and interactivity does.

## Consequences

**Good:** client-side navigation with no server round trip per route change; TanStack
Query's cache lets independent components on one page (KPI tiles, tables) query
overlapping data without redundant requests or prop-drilling; one API surface
(`src/app/api/**`) that's easy to test and version independently of any page; mutation +
invalidation is a first-class pattern instead of a Server Action plus manual refresh.

**Bad / accepted costs:** first paint is a client bundle, not server-rendered HTML — no
free SSR content-on-load for the app shell. Auth/workspace resolution that used to happen
implicitly per-RSC-render now has to happen explicitly per Route Handler call. A client
fetch/error contract (`ApiError`, parsed from `ERROR_HANDLING.md` §6's response shape)
has to exist and be followed everywhere, or the pattern degrades into ad hoc `fetch`
calls.

**Now harder to change:** the rendering model touches every route under `(app)`.
Reverting to RSC-per-page would mean rewriting every page again, not a config flip.

## Alternatives considered

| Option                                                          | Why not                                                                                                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep RSC-only, add TanStack Query only for client interactivity | Doesn't solve the actual ask — most screens are data tables/forms, i.e. exactly what stays server-fetched under this option                                   |
| Eject to a bare SPA (Vite + router, separate backend)           | Throws away workspace isolation enforcement, the error contract, and i18n for no benefit — Next.js Route Handlers already deliver the navigation speed wanted |

## Revisit when

A second, non-Next.js consumer of `src/app/api/**` appears (a mobile app, a public API
product). At that point Route Handlers should formalize into a versioned, documented API
— which is also the moment ADR-0002's "second consumer" trigger fires for the
single-app-vs-monorepo question.
