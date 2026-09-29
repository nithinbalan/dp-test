# Components

Auto-loaded when you work anywhere under `src/components`.

## Before you create anything

```bash
pnpm ctx:find "what you are about to build"
```

Escalation order — creating new is the **last** resort:
use as-is → add a variant value → extend props → compose a molecule → create new.

A library with three buttons has no design system, however good each button is.

## Tiers, and which way dependencies flow

```
atoms  <-  molecules  <-  organisms  <-  templates  <-  pages(src/app)
```

An atom importing another atom is a molecule — move it up. Lint-enforced by
`local/tier-boundary`. Each tier folder has its own generated `CLAUDE.md` index that
loads when you work there — read that one, not all four.

## Non-negotiable here

- **Prop vocabulary is closed.** `variant` / `size` / `tone` — never `type`, `kind`,
  `appearance`. See [COMPONENT_CONTRACT.md](../../docs/COMPONENT_CONTRACT.md).
- **Tokens are the only legal values.** No hex, no `rgb()`, no `p-[13px]`, no raw px.
  Need a value that doesn't exist? Add the token — that five minutes is why the system
  stays coherent.
- **No external margins.** A component never positions itself; its parent does.
- **TSDoc on `<Name>Props` is mandatory** — it is what `ctx:find` searches, so a
  component without one gets duplicated within a month. `pnpm ctx:check` fails without it.
- Every component ships a story. No story, no review, no visual-regression coverage.

## LTR and RTL are both first-class

The product ships English and Arabic. Two rules, both lint-enforced, because these
bugs are invisible to anyone reviewing in English:

- **Logical properties only.** `ms-4` not `ml-4`; `text-start` not `text-left`;
  `start-0` not `left-0`; `border-s` not `border-l`. One class, correct in both
  directions. `rtl:-scale-x-100` is allowed for glyphs that must mirror.
- **Copy comes in as props.** Never `<button>Sign in</button>`. Use a `messages` prop
  with a named defaults object — see `LoginForm` or `ThemeToggle`.

Check every component in Storybook's Direction toolbar: LTR and RTL, light and dark.
Four states, two clicks. Full detail: [INTERNATIONALIZATION.md](../../docs/INTERNATIONALIZATION.md)

## Writing tests

**One test file per component: `<Name>.test.tsx`.** RTL, theme, loading state, error
state — every one of those is the _same component_ under a different condition, not a
different feature. Put them in `describe` blocks inside the one file, not a sibling
file like `<Name>.rtl.test.tsx` or `<Name>.dark.test.tsx`.

```tsx
describe('Button', () => {
  it('renders its label', () => { ... });

  describe('in RTL', () => {
    afterEach(() => document.documentElement.removeAttribute('dir'));
    it('orders slots logically, so direction flips them', () => { ... });
  });
});
```

A split file is a second place someone has to remember exists — it does not show up
next to the component in an editor's file list the way `describe` blocks show up in
the test output, `ds:tiers` only expects one `<Name>.test.tsx` per component and would
not catch a stray `<Name>.rtl.test.tsx` sitting beside it, and the next person to touch
the component has no signal that RTL coverage lives somewhere else. See
[`Button.test.tsx`](./atoms/Button/Button.test.tsx) for the reference shape.

## Nothing here fetches data

Atoms, molecules and organisms receive data as props. Fetching, routing, `cookies()`,
and workspace awareness belong to the page tier in `src/app`.
