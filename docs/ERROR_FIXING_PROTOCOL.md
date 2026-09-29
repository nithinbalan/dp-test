# Error Fixing Protocol

**Read this before changing any code in response to a failing test, a red build, a
stack trace, a lint error, or a bug report. Every time. No exceptions.**

This exists because the default reflex — human or AI — when facing a red screen is to
make the red go away. That reflex produces `try/catch` around the symptom, an `any`
cast, a `?.` that hides a null that should never have existed, or a skipped test.
Each of those trades a loud failure for a silent one, and silent failures in a
multi-tenant system mean cross-workspace data leaks that nobody notices for months.

---

## The protocol

### Step 1 — Reproduce before you theorise

Do not edit code you have not seen fail. Write the failing case as a test if one does
not exist. That test is the deliverable; the fix is a side effect of it passing.
If you cannot reproduce it, say so explicitly and stop — do not ship a speculative fix.

### Step 2 — Name the layer

Where does the error _originate_, not where it surfaced?

`input validation` · `authz` · `workspace resolution` · `data access` · `domain logic`
· `rendering` · `config/env` · `third-party` · `build/tooling`

An error caught in the UI almost never belongs to the UI. Fix it where it originates.
If the answer is `workspace resolution` or `authz`, escalate — treat it as a security
incident and follow `SECURITY_HYGIENE.md` §7 before writing the fix.

### Step 3 — Classify against the taxonomy

Using `ERROR_HANDLING.md` §1: is this **Expected**, **Unexpected**, or **Fatal**?

- **Expected** and it threw → the bug is the _missing branch in the type_, not the
  throw. Convert to `Result` and let the compiler find the callers.
- **Unexpected** → find the invariant that was violated. Something upstream let a
  value through that should have been impossible.
- **Fatal** → the bug is that the process kept running. Make it fail at boot.

### Step 4 — Find the root cause, then go one level further

State it in a sentence: _"X happened because Y, which was possible because Z."_
`Z` is the real fix. If you cannot write that sentence, you have not found it yet.

### Step 5 — Fix the class, not the instance

Ask: **can this bug exist anywhere else in the codebase right now?** Grep for the
pattern. If it can, either fix all occurrences or add a lint rule / type constraint
that makes it unrepresentable, and note it in the PR.

Preference order for the fix itself:

1. Make the bad state **unrepresentable** (types, closed unions, branded ids)
2. Make it **fail at boot** (schema-validated config)
3. Make it **fail in CI** (lint rule, test)
4. Make it **fail loudly at runtime** (assertion, `AppError`)
5. Handle it (only when it is genuinely an Expected failure)

### Step 6 — Prove the fix

- The reproduction from Step 1 now passes, and **fails again if you revert the fix**.
  An unverified fix is a guess.
- `pnpm verify` is green.
- No new `@ts-expect-error`, `eslint-disable`, `any`, or skipped test. If one is truly
  unavoidable it needs an inline justification comment and a reviewer's explicit sign-off.

### Step 7 — Close the loop

- Run `SECURITY_HYGIENE.md` checklist if the fix touched auth, workspace scope, input
  handling, or any dependency.
- If the root cause was a gap in these docs, **update the doc in the same PR**.
- If it revealed an architectural decision, write an ADR.

---

## Banned "fixes"

These are rejected in review on sight. No discussion needed.

| Anti-fix                                         | Why it's worse than the bug                                           |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `try/catch` around a symptom                     | Converts a diagnosable crash into corrupted state                     |
| `as any` / `as unknown as T`                     | Deletes the check that was about to save you                          |
| Adding `?.` to silence a null                    | The null is the bug; now it spreads                                   |
| `?? []` / `?? ''` defaults on unexpected empties | Renders "0 results" instead of failing — users trust the wrong number |
| `catch { return null }`                          | The caller now cannot distinguish "none" from "broken"                |
| Widening a type until it compiles                | Moves the failure to production                                       |
| `eslint-disable` on the isolation or token rules | See `WORKSPACE_ISOLATION.md`; requires an ADR                         |
| Skipping / `.only` on a test                     | Ships the bug with a note saying you knew                             |
| Retry loop with no idempotency check             | Duplicate writes under load                                           |
| Fixing the test to match the wrong output        | —                                                                     |

## When the fix is genuinely a workaround

Sometimes it is (upstream bug, deadline). Then it must have, in the code:

```ts
// WORKAROUND(<ticket>): <what is actually broken upstream>
// Remove when: <specific, checkable condition>
// Risk if left: <consequence>
```

...plus a tracked ticket. A workaround without a removal condition is permanent.

---

## For AI-assisted fixes

Every prompt that asks for a fix must carry this file. The output is rejected unless
it states, explicitly:

1. The reproduction, 2. the layer, 3. the classification, 4. the one-sentence root
   cause, 5. whether the class of bug exists elsewhere, 6. which of the five preference
   levels the fix sits at, and why not a higher one.

"It works now" is not an acceptable justification.
