# Code Review Standard

Review is the last human gate. It is not a style argument — lint and Prettier already
settled those, and if you are discussing formatting in a PR, a config is missing.

Review order matters. Stop at the first level that fails; there is no point discussing
naming in code that leaks tenant data.

---

## Level 1 — Correctness & safety (blocking)

- Does it do what the PR says? Does the PR say what it does?
- Workspace isolation intact (`WORKSPACE_ISOLATION.md`). **Every** data-access change
  gets read twice.
- Security checklist filled in, honestly (`SECURITY_HYGIENE.md`).
- Errors follow `ERROR_HANDLING.md`. Expected failures are typed, not thrown.
- Edge cases: empty, one, many, huge · null/undefined · concurrent · slow network ·
  failed request · unauthorised · non-Latin text · very long strings.
- Tests exist, test behaviour not implementation, and **fail without the change**.

## Level 2 — Reusability & duplication (blocking)

The question is never "is this good code" but "is this the _third_ time we've written it".

- Was `pnpm ds:neighbors` run? Does this duplicate an existing component/hook/util?
- Is the abstraction earned? **Two occurrences is a coincidence; three is a pattern.**
  Premature abstraction costs more than duplication — a wrong shared abstraction is
  harder to remove than a copy-paste.
- Does shared code belong in `@shared/*` (used by ≥2 features, no feature knowledge)?
  If it imports from a feature, it is not shared.
- Is the abstraction leaking? A helper with a `mode` flag that switches its whole
  behaviour is two functions.
- Does anything reimplement a platform or library primitive we already ship?

## Level 3 — Design & boundaries

- Correct tier; dependencies flow one way.
- Server/client split minimal and deliberate; `'use client'` as low as possible.
- Module boundaries: does this file know things it has no business knowing?
- Is the unit of change small? Would a future change touch one file or seven?
- Naming reflects domain language (`workspace`, not `tenant`/`org`/`account` mixed).

## Level 4 — Readability

- Can a new engineer follow it without asking the author?
- Names say _what_ and _why_; comments explain **why**, never what.
- Early returns over nesting. No cleverness that needs a comment to be legible.
- Function does one thing; length is a symptom, not the disease.
- No dead code, commented-out blocks, or stray `TODO` without a ticket.

## Level 5 — Scalability & performance

- Query patterns: N+1, missing index, unbounded result set, missing pagination.
- Anything unbounded that grows with tenants, rows, or users?
- Cache keys workspace-scoped and invalidated correctly.
- Bundle impact of a new client dependency.
- Does it hold at 10× current data? Not 1000× — that is speculation — but 10×, yes.

---

## Reviewer conduct

- **Distinguish blocking from preference.** Prefix non-blocking comments with `nit:`.
  A review where everything is blocking teaches authors to ignore reviews.
- Ask, don't assert, when you might be missing context: "what happens if X is empty?"
- Suggest the concrete alternative. "This is confusing" is not actionable.
- Approve when it is better than what is there now, not when it is perfect.
- Praise good work explicitly. Reviews that only ever contain criticism decay into theatre.

## Author checklist before requesting review

```
- [ ] `pnpm verify` green locally
- [ ] Security hygiene checklist filled in (every line answered)
- [ ] Ran ds:neighbors; stated what existing code was considered and why it didn't fit
- [ ] Self-reviewed the full diff on the PR page, not just in the editor
- [ ] PR description says what changed, why, and what a reviewer should look at hardest
- [ ] Screenshots / stories for any visual change
- [ ] No new eslint-disable, @ts-expect-error, any, or skipped test (or each is justified inline)
- [ ] Docs updated if behaviour or a convention changed
```

## Generated code

Reviewed to the _same_ standard, with extra attention to: invented prop names, silently
added dependencies, plausible-but-wrong error handling, duplicated existing components,
and confident code paths for cases that cannot occur. It reads better than human code
and is wrong in subtler ways — spend your attention accordingly.
