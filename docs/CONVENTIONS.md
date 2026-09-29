# Conventions

Small, boring, non-negotiable. Consistency here is worth more than any individual choice.

## Naming

| Thing                        | Convention                       | Example                               |
| ---------------------------- | -------------------------------- | ------------------------------------- |
| Component folder/file/export | PascalCase, all three identical  | `Button/Button.tsx` → `Button`        |
| Hook                         | `use` + camelCase                | `useWorkspace.ts`                     |
| Non-component module         | kebab-case                       | `with-workspace.ts`, `format-date.ts` |
| Type / interface             | PascalCase, no `I` prefix        | `WorkspaceContext`                    |
| Constant                     | SCREAMING_SNAKE at module scope  | `MAX_UPLOAD_BYTES`                    |
| Boolean                      | `is`/`has`/`can`/`should`        | `isLoading`                           |
| Test                         | `*.test.ts(x)` beside the source | `Button.test.tsx`                     |
| DB table/column              | snake_case, plural tables        | `workspace_members.created_at`        |
| Route segment                | kebab-case                       | `/workspace-settings`                 |

**One vocabulary.** The tenant concept is `workspace` — never `tenant`, `org`,
`account`, or `company` in code, DB, or UI copy. Synonyms in a domain model are how two
engineers build the same feature twice.

## TypeScript

- `strict` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. They are on
  because the bugs they catch are exactly the ones that survive review.
- No `any`. No non-null `!` (narrow instead). No `as` except at a parsed boundary.
- No `enum` — const object + union type (erasable, tree-shakeable, no runtime surprise).
- Branded types for identifiers: `WorkspaceId`, `UserId`. A `string` id can be passed
  where any other `string` id is expected, which is exactly the class of bug that leaks
  data across workspaces.
- Prefer `type` to `interface` unless declaration merging is genuinely needed.
- Infer return types for internal functions; declare them on exported API.

## Imports

Alias over relative for anything outside the current folder. Order (auto-sorted):
node builtins → external → `@shared/*` → `@server/*` → tier aliases → relative → styles.
Type-only imports use `import type`.

## Functions

- One job. If the name needs "and", split it.
- Object parameter once you hit three arguments — positional booleans are unreadable at
  the call site.
- Early return over `else`. Guard clauses at the top.
- Pure where possible; side effects pushed to the edges.

## Comments

Explain **why**. The code already says what. Comment: non-obvious constraints, business
rules with a source, workarounds (with removal conditions), and anything that will look
like a mistake to the next reader. Delete commented-out code — git remembers.

## Git

- Branch: `<type>/<short-description>` — `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`.
- Commits: conventional (`feat(workspace): resolve schema from subdomain`), imperative,
  explain why in the body when it isn't obvious.
- Small PRs. A 2000-line PR does not get reviewed, it gets approved.
- Never commit: secrets, `.env*`, generated output (except `manifest.json`), lockfile conflicts.

## Files

Under ~300 lines. Over that is a signal, not a violation — but investigate it: pull
out hooks, subcomponents, or utility modules instead of letting one file keep growing.
800 lines is a hard ceiling, enforced by ESLint (`max-lines`, error) — a file that hits
it fails the build. Don't write toward the ceiling; treat crossing ~300 as the point to
decompose into reusable pieces, so 800 is never actually reached in normal work.
One component per file. Colocate test, story, and types with the source.
