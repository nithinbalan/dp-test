# Documentation Index

These are rules, not suggestions. Most are enforced mechanically; the rest are
enforced in review. Read the ones your task routes to before writing code.

## Non-negotiable

| Doc                                                    | Covers                                                                   | Enforced by                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| [WORKSPACE_ISOLATION.md](./WORKSPACE_ISOLATION.md)     | Schema-per-tenant. The invariant the product cannot survive breaking.    | `local/require-workspace-scope`, branded types, isolation test suite |
| [ERROR_HANDLING.md](./ERROR_HANDLING.md)               | The fixed error pattern. `AppError` + `Result`.                          | `local/error-handling-contract`                                      |
| [ERROR_FIXING_PROTOCOL.md](./ERROR_FIXING_PROTOCOL.md) | How to fix an error without hiding it. Read before editing failing code. | PR template, review                                                  |
| [SECURITY_HYGIENE.md](./SECURITY_HYGIENE.md)           | Checklist run at **every** work completion.                              | PR template, CI audit                                                |

## Context at scale

| Doc                                                  | Covers                                                                                                                                     | Enforced by              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| [CONTEXT_ARCHITECTURE.md](./CONTEXT_ARCHITECTURE.md) | How context stays colocated, generated and mandatory as the app grows. Read this to understand why `CLAUDE.md` files appear inside `src/`. | `ctx:drift`, `ctx:check` |
| [system/MAP.md](./system/MAP.md)                     | Generated index of every domain, route, error code, env var and alias.                                                                     | generated                |

## Consistency

| Doc                                                      | Covers                                     | Enforced by                                                                                          |
| -------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)                   | Atomic tiers, tokens, composition.         | `local/tier-boundary`, `local/no-hardcoded-design-values`, `local/no-arbitrary-tailwind`, `ds:tiers` |
| [COMPONENT_CONTRACT.md](./COMPONENT_CONTRACT.md)         | Closed prop vocabulary.                    | `ds:check`                                                                                           |
| [AI_GENERATION_PROTOCOL.md](./AI_GENERATION_PROTOCOL.md) | Grounding, drift gates, regeneration loop. | `ds:neighbors`, `ds:manifest`, gates 1–6                                                             |
| [TANSTACK_QUERY.md](./TANSTACK_QUERY.md)                 | Client data-fetching & mutation rules.     | review                                                                                               |
| [CONVENTIONS.md](./CONVENTIONS.md)                       | Naming, TS, imports, git.                  | ESLint, Prettier, review                                                                             |

## Process

| Doc                                              | Covers                                           |
| ------------------------------------------------ | ------------------------------------------------ |
| [ARCHITECTURE.md](./ARCHITECTURE.md)             | Shape, layering, where a module lives, aliases   |
| [CODE_REVIEW.md](./CODE_REVIEW.md)               | Review levels, reusability bar, reviewer conduct |
| [DEFINITION_OF_DONE.md](./DEFINITION_OF_DONE.md) | When a task is actually finished                 |
| [TESTING.md](./TESTING.md)                       | Layers, non-negotiable suites                    |
| [adr/](./adr/)                                   | Decisions that are expensive to reverse          |

## Generated, never edited

These are projections of the code — the component library, the server domains, and the
system map. CI fails if they drift, and the commit hook regenerates them for you.

| File                              | Generated from                                              |
| --------------------------------- | ----------------------------------------------------------- |
| `design-system/manifest.json`     | component source, via the TypeScript compiler API           |
| `src/components/<tier>/CLAUDE.md` | a compact per-tier index, auto-loaded when you work there   |
| `<module>/CLAUDE.md`              | that module's public API + deps + the ADRs affecting it     |
| `system/MAP.md`, `adr/index.md`   | domains, routes, error codes, env, aliases, ADR frontmatter |
| `COMPONENT_CONTRACT.md` §1 tables | `design-system/contract.json`                               |

`design-system/contract.json` is the one hand-maintained file: the prop vocabulary is
policy and is not derivable from code. Everything else about components comes from the
TSDoc on `<Name>Props`, which lives next to the code it describes.

## Reading order for a new contributor

1. `CLAUDE.md` (root) — 5 minutes, routes everything
2. ARCHITECTURE → CONVENTIONS
3. WORKSPACE_ISOLATION — in full, before touching data
4. ERROR_HANDLING → ERROR_FIXING_PROTOCOL
5. DESIGN_SYSTEM → COMPONENT_CONTRACT — before touching UI
6. TANSTACK_QUERY — before writing a query or mutation hook
7. SECURITY_HYGIENE — bookmark the checklist; you will use it daily
