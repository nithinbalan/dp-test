# AI Generation Protocol

How code gets generated here without the library drifting. Three layers: **ground the
model before it writes**, **catch drift deterministically after it writes**, **make
regeneration cheaper than patching**.

The premise: a model will follow concrete examples far more reliably than written rules,
and will follow a failing check more reliably than either. So we spend our effort on
examples and checks, not on longer prose instructions.

---

## Layer 1 — Ground the model before it generates

### 1.1 The manifest is required context — and it is generated, never written

`design-system/manifest.json` is a machine-readable registry of every component:
name, tier, path, description, props (name/type/required/default), tags, status.

**No generation prompt is valid without it.**

It is produced by `pnpm ds:manifest`, which reads the actual component files through
the TypeScript compiler API — real type resolution, so intersections, `Omit<>` and
imported prop types all resolve correctly. Descriptions, `@default`, `@tag` and
`@status` come from the TSDoc on `<Name>Props`.

This is the whole answer to staleness: **the manifest is a projection of the code, not
a document about it.** Nobody maintains it, so nobody can forget to. A hand-maintained
registry is worse than none, because a model will trust it and propagate its errors
with confidence.

Three things are generated from source, all by the same command:

| Artifact                               | For                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `design-system/manifest.json`          | tooling and prompt envelopes (machine)                                  |
| `src/components/<tier>/CLAUDE.md`      | reading — a compact index per tier, **auto-loaded** when you work there |
| `docs/COMPONENT_CONTRACT.md` §1 tables | the human-facing contract reference                                     |

The one hand-maintained input is `design-system/contract.json`. The prop vocabulary is
a _policy_ decision and genuinely is not derivable from code — so it lives in exactly
one file and is projected everywhere else. There is no second copy to drift.

### 1.1b Freshness is a side effect of committing, not a task

- **Write path:** `lint-staged` regenerates and stages the output whenever a component
  or the contract changes. Same as regenerating a lockfile.
- **CI gate:** `pnpm ds:drift` regenerates in memory and diffs against what was
  committed, failing on any difference. It **writes nothing**, so it cannot repair the
  drift it is reporting — a check that fixes what it checks is not a check.
- **Read path:** `src/components/<tier>/CLAUDE.md` loads automatically when you work in
  that tier. It is an index, not a catalog — props live in `<Name>.types.ts`.
  Loading the entire registry every time is expensive and unnecessary; use
  `pnpm ds:neighbors` to search across tiers instead.

### 1.2 First question is always "does this exist?"

Before writing a component, run:

```bash
pnpm ds:neighbors "a button that shows a spinner while submitting"
```

This scores the manifest against the request and returns the closest existing
components. The correct outcome is often **"extend `Button` with `isLoading`"**, not a
new `SubmitButton`. A model asked to create will always create; it has to be asked to
search first, with a tool that actually searches.

Escalation order: **use as-is → add a variant value → extend props → compose into a new
molecule → create new**. Creating new is the last resort, and the PR must say why the
four cheaper options were rejected.

### 1.3 Few-shot from nearest neighbours

`ds:neighbors` also emits the **full source of the 1–3 closest components** for
inclusion in the prompt. This is the highest-leverage thing in this document: models
mimic concrete code far more reliably than they follow style prose. Neighbours are
chosen from the same tier where possible — an atom is shown atoms.

### 1.4 The standard prompt envelope

Every component-generation prompt carries, in this order:

1. `design-system/manifest.json` (registry + `contract` block)
2. `docs/COMPONENT_CONTRACT.md` (prop vocabulary — the closed word list)
3. Source of the 1–3 nearest neighbours (the examples)
4. `design-system/tokens/semantic.css` (the legal values)
5. The actual request
6. The output rules below

Assembled by `tooling/scripts/find-neighbors.mjs`. Do not hand-assemble prompts; a
hand-assembled prompt is one that quietly omits the manifest.

### 1.5 Output rules given to the generator

- Emit the full folder: `Component.tsx`, `Component.types.ts`, `Component.stories.tsx`,
  `Component.test.tsx`, `index.ts`.
- Use only prop names from the contract. Use only tokens from the token file.
- No new dependencies. No hex, no arbitrary Tailwind values, no raw px.
- Respect tier boundaries; declare the tier explicitly in the file header.
- State which existing components were considered and why they were insufficient.

## Layer 2 — Catch drift deterministically, after generation

Nothing here relies on a human noticing. In order:

| #   | Gate                          | Command                       | Catches                                                                                          |
| --- | ----------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | Token lint                    | `pnpm lint`                   | hex, `rgb()`, arbitrary Tailwind, raw px                                                         |
| 2   | Tier + naming lint            | `pnpm ds:tiers`               | wrong folder for tier, export ≠ filename, upward imports, missing story/test/index               |
| 3   | Contract check                | `pnpm ds:check`               | banned prop synonyms, missing defaults, `string` where a union is required, manifest out of date |
| 4   | Types                         | `pnpm typecheck`              | the rest                                                                                         |
| 5   | Storybook + visual regression | `pnpm build-storybook` + diff | code that lints clean but _looks_ wrong — spacing, alignment, weight                             |
| 6   | Critique pass                 | separate narrow AI call       | judgement-level deviation the above cannot express                                               |

Gates 1–4 block the commit. Gate 5 blocks the PR. Gate 6 comments.

### 2.1 The critique pass is a _separate_ call

Do not ask the generating call to also police itself — a model that just wrote code is
the worst available judge of it, and self-review inside one call reliably rubber-stamps.

The critique call gets **only**: the manifest, the contract, the new component's source,
and one instruction:

> List deviations from the contract and from the nearest existing components. For each:
> file, line, the rule broken, and the minimal correction. Report only deviations. Do not
> rewrite the component. If there are none, say "no deviations".

Narrow scope is what makes it reliable. Its checklist:

- prop names outside the vocabulary, or synonyms of existing concepts
- a concept already solved by an existing component (duplication)
- token bypass, spacing/sizing inconsistent with siblings
- missing states (loading/disabled/error/empty), missing a11y wiring
- tier violation, missing story case
- error handling that departs from `ERROR_HANDLING.md`

## Layer 3 — Make regeneration cheaper than drift

**When validation fails, regenerate against the flagged diff. Do not hand-patch.**

Hand-patching a generated component produces a one-off exception. One-off exceptions are
invisible individually and fatal collectively: after fifty of them the manifest describes
a system that no longer exists, and every future generation inherits the decay.

The loop:

```
request
  └─> ds:neighbors  ──> generate ──> gates 1–5 ──> critique
        ▲                                             │
        └──── regenerate with failures as input ◀─────┘   (max 3 rounds)
                                │
                     still failing after 3?
                                ▼
              STOP. The system is missing something.
              Fix the manifest / token / contract, then regenerate.
```

Three failed rounds is a signal about the _system_, not the component — a missing token,
an ambiguous contract entry, an absent primitive. Fix the source of truth. That is what
makes consistency compound instead of decay as the library grows.

**Regeneration is automatic** — the commit hook handles it, and `ds:drift` fails CI if
it was bypassed. You do not need to remember `pnpm ds:manifest`; you only need to not
hand-edit its output.

The thing you _do_ have to write by hand is the **TSDoc on `<Name>Props`**. That is the
real unit of truth, it is colocated with the code it describes, and it is what
`ds:neighbors` searches. A component with a missing or placeholder description fails
`ds:check` — not for tidiness, but because an unfindable component gets duplicated
within a month.

## Non-UI generation

The same shape applies to server code, with different context:

| For                      | Required context                                                         |
| ------------------------ | ------------------------------------------------------------------------ |
| Data access              | `WORKSPACE_ISOLATION.md` + an existing repository as the example         |
| Route handlers / actions | `ERROR_HANDLING.md` + `SECURITY_HYGIENE.md` + an existing handler        |
| Any bug fix              | `ERROR_FIXING_PROTOCOL.md` — and the output must answer its seven points |
| Every completed task     | `SECURITY_HYGIENE.md` completion checklist, filled in                    |

## Rules for the human in the loop

- You own the merged code. "The AI wrote it" is not a review outcome.
- Read the diff, not the summary of the diff.
- Reviewing generated code is harder than reviewing human code: it is fluent, plausible,
  and confidently wrong in ways that read well. Slow down at the parts that look most obvious.
- If you find yourself approving because it "looks like the others", check that it _is_
  like the others — that is what gate 5 exists for.
