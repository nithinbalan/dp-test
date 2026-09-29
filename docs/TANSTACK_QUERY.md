# TanStack Query

**Status: the only client data-fetching mechanism.** No `useEffect` + `fetch`, no ad hoc
`fetch` in a component, no local `useState` cache of server data. See
[ADR-0006](./adr/0006-spa-with-tanstack-query.md) for why the app is shaped this way.

---

## 1. Where hooks live

Query and mutation hooks are colocated per domain, mirroring `src/app/api/<module>`:

```
src/app/(app)/<domain>/queries.ts   # useXList, useXDetail, useCreateX, ...
```

A component never calls `useQuery`/`useMutation` with an inline fetcher. It imports a
named hook that owns the key, the fetcher, and the types. This is what keeps query keys
grep-able and invalidation safe — a key typed twice in two components is how cache
invalidation silently stops working.

## 2. Query keys

One factory per domain, hierarchical, never a hand-typed array in a component:

```ts
export const dpiaKeys = {
  all: ['dpia'] as const,
  lists: () => [...dpiaKeys.all, 'list'] as const,
  list: (filters: DpiaFilters) => [...dpiaKeys.lists(), filters] as const,
  detail: (id: DpiaId) => [...dpiaKeys.all, 'detail', id] as const,
};
```

Invalidate at the narrowest node that covers what changed — `dpiaKeys.lists()`, not
`dpiaKeys.all` — unless the mutation genuinely affects every query in the domain.

## 3. The fetcher

All hooks call a single typed client, `@shared/lib/api-client`, never `fetch` directly.
It:

- Hits a Route Handler under `src/app/api/**`.
- Parses the `{ error: { code, message, requestId } }` shape (`ERROR_HANDLING.md` §6)
  into a typed `ApiError` — `code`, `userMessage`, `requestId`.
- Zod-parses the success body. Same "parse, don't validate" rule as the server side.

A query/mutation's `error` is always an `ApiError`, never a raw `Response` or a string.

## 4. Client defaults

One `QueryClient`, created once in a root client provider (`src/app/providers.tsx`),
never per-component:

- `staleTime`: not `0`. Pick it per query based on how often the data actually changes.
  `0` everywhere means every mount refetches, which defeats the cache entirely.
- `retry`: **off** for a 4xx `ApiError` (an Expected failure from `Result` — retrying a
  403 or a validation error does nothing). Default exponential backoff is fine for
  network errors / 5xx.
- `refetchOnWindowFocus`: on. This is an admin panel — a record silently edited by
  someone else since the tab lost focus is worse than one extra request.

## 5. Colocation over prop-drilling

Organisms may call their own `useQuery` — e.g. a `DataTable` fetching its own page of
rows. This is a deliberate exception to `DESIGN_SYSTEM.md`'s "organisms receive data as
props" default, not a loophole: the query cache dedupes identical keys, so two widgets on
the same page independently querying the same data issue one request, not two.
Prop-drilling server data through several layers just to keep fetching page-only is the
exact cost TanStack Query exists to remove.

Atoms and molecules still never fetch. This privilege stops at organism.

## 6. Mutations

- Every mutation invalidates (or optimistically updates) the queries it affects, defined
  in the same hook — a mutation with no invalidation is a bug that ships looking clean.
- Optimistic updates require a rollback: snapshot the previous value in `onMutate`,
  restore it in `onError`. No optimistic update without a rollback path.
- A mutation's error is handled the same way a query's is: surfaced as `ApiError`, never
  swallowed with a bare `catch`.

## 7. Avoiding waterfalls

- Independent data: parallel `useQuery` calls, or `useQueries` for a dynamic list. Do not
  chain queries that don't actually depend on each other.
- Dependent data: `enabled: Boolean(parentId)` — never a conditionally-called hook.
- Paginated tables: `placeholderData: keepPreviousData` so a page change doesn't flash an
  empty table.
- Filters/sort/page live in the URL (`ARCHITECTURE.md`'s "URL state" row) and feed the
  query key directly. The server paginates and filters; the client never loads a full
  table into memory to filter it there.

## 8. Derived data

Use the `select` option to shape a query's data for a specific component instead of
transforming it in the render body — `select` output is memoized per-reference, a
render-body transform re-runs and re-renders on every parent render.

## 9. Devtools

`ReactQueryDevtools` mounted only when `NODE_ENV !== 'production'`.

## 10. Testing

Wrap the component under test in a fresh `QueryClientProvider` with a new `QueryClient`
per test (`retry: false`; don't reuse a client across tests) — a shared client leaks
cache state between tests and produces order-dependent failures. See `docs/TESTING.md`.

---

**Related:** [ADR-0006](./adr/0006-spa-with-tanstack-query.md) (why) ·
[ERROR_HANDLING.md](./ERROR_HANDLING.md) §5–6 (the response shape this client parses) ·
[ARCHITECTURE.md](./ARCHITECTURE.md) (rendering + state) ·
[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) §1 (tier rules this modifies for organisms).
