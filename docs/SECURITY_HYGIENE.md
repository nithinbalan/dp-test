# Security Hygiene

**This checklist runs at the completion of every unit of work — every PR, every task,
every AI-generated change. Not weekly, not before release. Every time.**

Security debt in a multi-tenant system is not like other debt: the interest payment is
another customer's data. The cost of running this list is minutes; the cost of skipping
it once is unbounded.

Sections 1–8 are the reference. The **Completion Checklist** at the bottom is what you
actually run.

---

## 1. Workspace isolation (highest severity)

Any change touching data access is guilty until proven innocent. Full detail in
[WORKSPACE_ISOLATION.md](./WORKSPACE_ISOLATION.md).

- Every query executes inside `withWorkspace()`. No exceptions, no "just this one read".
- Workspace identity comes from the **authenticated session**, never from a request
  body, query param, or client-supplied header.
- No user-controlled value ever reaches a schema name, table name, or `search_path`.
- Cross-workspace joins are impossible by construction, not by convention.
- Cache keys, queue jobs, file paths, and log correlation ids are workspace-namespaced.
  A cache key without a workspace prefix is a data leak with a TTL.

## 2. Secrets

- No secret in source, tests, fixtures, stories, comments, or commit messages.
- Every env var declared and validated in `@shared/config/env` — the app refuses to boot
  on a missing or malformed one.
- `NEXT_PUBLIC_*` is a **publication**, not a config prefix. Anything with that prefix is
  public forever. Confirm each one deliberately.
- Secrets never cross into a client bundle, an error message, or a log line.
- Rotation path exists and is documented for anything long-lived.

## 3. Transport & headers

- Headers in `next.config.ts` intact (HSTS, `nosniff`, `DENY`, referrer, permissions).
- CSP present and not weakened. `unsafe-inline` / `unsafe-eval` require an ADR.
- Cookies: `httpOnly`, `secure`, `sameSite=lax` minimum; `__Host-` prefix for session.
- CORS is deny-by-default. No `*` on any authenticated route.

## 4. Input & output

- Every external input (body, params, search params, headers, webhooks, env, third-party
  responses) parsed through a Zod schema at the boundary. Unvalidated input is a bug even
  when it happens to work.
- Parse, don't validate: the schema's output type is what flows onward, not the raw input.
- Output encoding by default. `dangerouslySetInnerHTML` needs a sanitiser and a comment.
- No string-built SQL. No string-built shell. No dynamic `import()` of a user-controlled path.
- File uploads: type sniffed from content not extension, size-capped, stored outside the
  web root under a workspace-scoped key, served through a signed URL.
- Redirects validated against an allowlist — open redirect is a phishing primitive.

## 5. AuthN / AuthZ

- Authorization is checked **server-side on every request**. UI hiding is cosmetic.
- Check on the _object_, not just the route: "can this user act on this record in this
  workspace", not "is this user logged in".
- Deny by default; new routes are protected unless explicitly opted out.
- Route Handlers are public HTTP endpoints (Server Actions are not used — [ADR-0006](./adr/0006-spa-with-tanstack-query.md)).
  Every one authenticates and authorizes independently — reaching it does not imply the
  SPA route that calls it allowed it.
- IDs in URLs are non-enumerable (UUIDv7/ULID), and possession of an ID is never authority.

## 6. Data handling & privacy (DPDP-relevant)

- Collect the minimum. If a field is not needed, do not store it.
- PII classified at the schema level and redacted in logs, traces, error contexts and
  analytics — redaction is allowlist-based (log named safe fields), never denylist.
- Retention and deletion path exists for every personal-data field, including backups
  and derived stores. A delete that leaves the row in an audit table is not a delete.
- Consent state is data with a lifecycle, not a boolean set once.
- Cross-border/processor transfers documented before the integration ships.

## 7. Dependencies & supply chain

- `pnpm audit` clean of high/critical, or each exception documented with an expiry.
- New dependency requires: what it replaces, maintenance signal, transitive count,
  licence. Prefer 30 lines of our code over a package for trivial things.
- Lockfile committed; CI installs with `--frozen-lockfile`.
- No install scripts from packages you did not vet.

## 8. Incident reflex

If a change is suspected to have leaked or crossed workspace data:
stop · do not "fix quietly" · determine blast radius (which workspaces, what data, how
long) · preserve logs · notify the owner · then fix, with a regression test that fails
without the fix. DPDP breach-notification timelines start at _detection_.

---

## Completion Checklist

Copy into every PR description. Every line is `yes` or `n/a — <reason>`. Never blank.

```
### Security hygiene (docs/SECURITY_HYGIENE.md)
- [ ] Every new/changed query runs inside withWorkspace(); workspace id came from the session
- [ ] No user input reaches a schema/table name, search_path, SQL string, shell, or file path
- [ ] Caches, jobs, uploads, and log ids are workspace-namespaced
- [ ] All external input parsed with Zod at the boundary
- [ ] Authorization checked server-side, on the object, deny-by-default (incl. every Route Handler)
- [ ] No secrets added; new env vars validated in @shared/config/env; NEXT_PUBLIC_* reviewed
- [ ] No PII added to logs/traces/analytics/error context; retention path exists for new fields
- [ ] Security headers / CSP / cookie flags unchanged or strengthened
- [ ] New dependencies justified; pnpm audit clean of high+critical
- [ ] No new eslint-disable on local/require-workspace-scope or local/error-handling-contract
- [ ] Errors return generic messages + requestId; no internals leaked (docs/ERROR_HANDLING.md §6)
```

**Any unchecked box blocks merge.** If a box does not apply, write why — "n/a" alone is
not an answer. The one you are tempted to wave through is the one that matters.
