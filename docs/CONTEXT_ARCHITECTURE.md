# Context Architecture

**The problem this solves:** an AI-assisted codebase fails at scale not because the model
writes bad code, but because it writes _plausible_ code without knowing what already
exists, what invariants apply, or what was decided last month. It then duplicates a
service, invents a second error shape, or writes a query outside `withWorkspace()` — all
of it fluent, reviewable-looking, and wrong.

Discipline does not fix this. "Remember to attach the docs" fails on the day someone is
in a hurry, which is every day. The fix is architectural: make context **impossible to
miss**, the same way we made isolation and token usage impossible to violate.

---

## The three properties

Every unit of the system — a component, a server domain, the error taxonomy, the env
contract — carries context that is:

### 1. Colocated

Context lives **next to the code it describes**, not in a central document.

`src/server/auth/CLAUDE.md` · `src/server/workspace/CLAUDE.md` · one per module.

Claude Code loads the `CLAUDE.md` of the directory being worked in. So editing
`src/app/api/billing/` loads billing's context automatically — nobody attaches it, nobody
remembers it. **Context delivery becomes a property of the file system.**

This is also why we do not keep one large index: a central file is a bottleneck that
every session pays for in tokens and that nobody updates when they add a folder.

### 2. Generated

The factual half of every context file is a projection of the code:

| Artifact                                            | Generated from                             | Command    |
| --------------------------------------------------- | ------------------------------------------ | ---------- |
| `design-system/manifest.json`                       | component source, via the TS compiler API  | `pnpm ctx` |
| `src/components/<tier>/CLAUDE.md` (generated block) | that tier's component index                | `pnpm ctx` |
| `docs/COMPONENT_CONTRACT.md` §1                     | `design-system/contract.json`              | `pnpm ctx` |
| `docs/system/MAP.md`                                | domains, routes, error codes, env, aliases | `pnpm ctx` |
| `<module>/CLAUDE.md` (generated block)              | that module's public API + deps            | `pnpm ctx` |

A generated file cannot go stale, because nobody maintains it. A hand-maintained
registry is **worse than none**: a model trusts it and propagates its errors confidently.

Each domain file is split by a marker:

```
<!-- GENERATED:domain -->   machine-owned: public API, dependencies, applicable rules
<!-- /GENERATED:domain -->
                            human-owned: WHY this exists, what people get wrong
```

Regeneration rewrites above the marker and **never touches what you wrote below it**.

### 2b. Retrieval speaks this codebase's vocabulary

We deliberately enforce one word per concept — `workspace`, never `tenant`. That makes
the code consistent and makes naive search **fail silently**: someone searching "tenant"
scores zero against everything and concludes nothing exists, then builds a duplicate.

`design-system/lexicon.json` maps the words people naturally reach for onto the words
this codebase uses. Synonym hits score lower than exact hits, so precision is preserved.
Add an entry whenever a search should have hit and didn't — that file is a log of every
near-miss, and it is the cheapest retrieval improvement available.

### 3. Mandatory

`pnpm ctx:check` fails the build when a unit of the system has no context:

| Rule                                              | Why it blocks                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Every domain has a `CLAUDE.md`                    | A domain with no context gets misused by the next agent that opens it                         |
| Its human section is not still `TODO`             | Generated facts say _what_; only a person can say _why_. That half prevents wrong assumptions |
| Every public export has TSDoc                     | An undescribed export is invisible to retrieval, so it gets **rebuilt instead of reused**     |
| Every component's `<Name>Props` has a description | Same — it is what `ctx:find` searches                                                         |
| `env.ts` and `.env.example` agree                 | Otherwise a new developer cannot boot, or config ships unvalidated                            |
| No broken doc links                               | A dead pointer is worse than none; an agent follows it and finds nothing                      |

**This is the scaling guarantee.** You cannot add a unit of the system without adding the
context that describes it. Growth cannot outrun documentation, because the build says no.

---

## How work actually starts

```bash
pnpm ctx:find "add an endpoint that exports invoices for a workspace"
```

Searches components, domains, public functions, routes and error codes, then prints a
**budgeted** reading list — plus the rules that are mandatory for that _shape_ of task.

Rule selection is **matched, not scored**. "Did the retrieval happen to rank the security
doc highly" is not a safety model: touching data always requires
`WORKSPACE_ISOLATION.md`, and `SECURITY_HYGIENE.md` is always required because it runs at
every completion.

Add `--prompt` to emit the full envelope — rules, domain context, nearest code as
few-shot examples, system map — for a generation call.

## Why budgeted, not exhaustive

A context window is finite, and an over-stuffed prompt buries the relevant part. Two
consequences:

- Read **one tier file**, or **one domain's** context — not the whole registry.
- `ctx:find` returns top matches per category, not everything that matched.

The system map is an _index of indexes_. It tells you where to look; it is not the thing
you read.

## Freshness is a side effect of committing

- **Write path:** `lint-staged` runs `pnpm ctx` and stages the result whenever a
  component, domain, route, contract or env schema changes.
- **CI:** `pnpm ctx:drift` regenerates in memory and diffs against what was committed.
  It **writes nothing**, so it cannot repair the drift it reports — a check that fixes
  what it checks is not a check.
- **You** never need to remember `pnpm ctx`. You only need to not hand-edit its output.

## Decisions reach the code they constrain

A decision spanning five domains used to live in one ADR that nobody opened. Now each
ADR carries frontmatter:

```yaml
affects:
  - src/server/workspace
  - src/server/db
```

...and `pnpm ctx` projects a **"Decisions that constrain this code"** section into every
affected path's `CLAUDE.md`. Editing `src/server/workspace` surfaces ADR-0001 without
anyone remembering it exists. `docs/adr/index.md` gives the reverse view.

`ctx:check` fails an ADR with no `affects:`, or one pointing at a path that no longer
exists — because a decision that reaches nobody is not a decision, it is a diary entry.

## What a human still owns

Generation cannot produce these, and they are the highest-value words in the repo:

1. **The WHY section** of each domain — the business problem, the non-obvious invariants,
   and _what a newcomer gets wrong_. That last part is worth more than any API table.
2. **TSDoc on every export** — colocated with the code, edited in the same motion.
3. **ADRs** — decisions expensive to reverse.
4. **`design-system/contract.json`** — the prop vocabulary is policy, not code.

Everything else is derived.

## Adding a new domain

1. `mkdir src/app/api/<name>` and write the code — service, repository, route folders,
   all in that one folder. The skeleton and the layering rules are in
   [ARCHITECTURE.md §Adding a backend module](./ARCHITECTURE.md#adding-a-backend-module).
   (`src/server/` is infrastructure only — `db`, `workspace`, `errors`.)
2. `pnpm ctx` — scaffolds `CLAUDE.md` with the generated half filled in.
3. Replace the `TODO` with the WHY. `ctx:check` fails until you do.
4. TSDoc every export. `ctx:check` fails until you do.
5. `pnpm verify`.

Steps 3 and 4 are the entire cost of keeping a large codebase legible, and they are
charged at the moment you have the context in your head — not six months later when
nobody does.
