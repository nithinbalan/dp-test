# Definition of Done

A task is done when **all** of the following are true. Not "code written". Not "it works
on my machine". Not "tests pass locally but CI is flaky".

---

```
## 1. It works
- [ ] Does what was asked, including the boring parts (empty, error, loading states)
- [ ] Manually exercised, not just unit-tested
- [ ] Behaviour verified against a real Postgres for anything touching data

## 2. It is safe
- [ ] docs/SECURITY_HYGIENE.md completion checklist filled in — every line answered
- [ ] Workspace isolation verified for any data-access change
- [ ] No secret, PII, or internal detail added to logs, errors, or the client bundle

## 3. It is correct under failure
- [ ] Errors follow docs/ERROR_HANDLING.md — no local variants
- [ ] If this was a bug fix: docs/ERROR_FIXING_PROTOCOL.md steps 1–7 answered in the PR
- [ ] Failing case reproduced first, and fails again if the fix is reverted

## 4. It is consistent
- [ ] docs/COMPONENT_CONTRACT.md vocabulary respected — no new prop synonyms
- [ ] Tokens only; no hex, arbitrary Tailwind, or raw px
- [ ] Correct tier; one-way imports
- [ ] `pnpm ds:manifest` re-run; manifest committed

## 5. It is verifiable
- [ ] Tests cover behaviour and the edge cases named in review
- [ ] Storybook story for every visual change, covering all states
- [ ] `pnpm verify` green

## 6. It is legible
- [ ] Someone else could change this in six months without asking you
- [ ] Docs/ADR updated if a convention, boundary, or decision changed
- [ ] PR description explains why, not just what
```

---

**The completion ritual.** At the end of every task — including every AI-assisted one —
run the security hygiene checklist. Not at release. Not at sprint end. At completion, every
time. A checklist run once a month is a document; run every time, it is a control.
