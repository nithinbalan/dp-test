## What & why

<!-- What changed, and why. Not a restatement of the diff. -->

## What should a reviewer look at hardest?

<!-- Point them at the risky part. -->

---

### Definition of done (docs/DEFINITION_OF_DONE.md)

- [ ] `pnpm verify` green
- [ ] Tests cover behaviour; a bug fix has a test that fails without the fix
- [ ] Stories/screenshots for visual changes
- [ ] Docs or ADR updated if a convention, boundary, or decision changed

### Security hygiene (docs/SECURITY_HYGIENE.md) — answer every line

- [ ] Every new/changed query runs inside withWorkspace(); workspace id came from the session
- [ ] No user input reaches a schema/table name, search_path, SQL string, shell, or file path
- [ ] Caches, jobs, uploads, and log ids are workspace-namespaced
- [ ] All external input parsed with Zod at the boundary
- [ ] Authorization checked server-side, on the object, deny-by-default (incl. Server Actions)
- [ ] No secrets added; new env vars validated in @shared/config/env; NEXT_PUBLIC_* reviewed
- [ ] No PII added to logs/traces/analytics/error context; retention path exists for new fields
- [ ] Security headers / CSP / cookie flags unchanged or strengthened
- [ ] New dependencies justified; `pnpm audit` clean of high+critical
- [ ] No new eslint-disable on local/require-workspace-scope or local/error-handling-contract
- [ ] Errors return generic messages + requestId; no internals leaked

### If this is a bug fix (docs/ERROR_FIXING_PROTOCOL.md)

- **Reproduction:**
- **Layer it originates in:**
- **Classification (expected / unexpected / fatal):**
- **Root cause — "X happened because Y, which was possible because Z":**
- **Can this bug class exist elsewhere? Where did you check?**
- **Fix level (1 unrepresentable → 5 handled), and why not higher:**

### Component work (docs/AI_GENERATION_PROTOCOL.md)

- [ ] Ran `pnpm ds:neighbors`; existing components considered:
- [ ] Reason a new component was needed (if it was):
- [ ] `pnpm ds:manifest` re-run and committed
