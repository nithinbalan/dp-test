# Design System — Atomic Design

Consistency here is not aesthetic preference. It is the mechanism that keeps a large,
partly AI-generated UI comprehensible: when every component takes the same props and
draws from the same tokens, a reviewer can hold the whole system in their head, and a
generator has one obvious right answer instead of ten plausible ones.

---

## 1. Tiers

| Tier         | Location                   | Definition                                                                                                       | Rules                                                                                                                                                                                                      |
| ------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Atom**     | `src/components/atoms`     | Smallest meaningful UI unit. Cannot be split without losing meaning. `Button`, `Input`, `Badge`, `Icon`, `Text`. | No app state, no data fetching, no other components, no layout margins                                                                                                                                     |
| **Molecule** | `src/components/molecules` | A small group of atoms doing one job. `FormField`, `SearchBar`, `Card`, `Pagination`.                            | Composes atoms only. Local UI state ok. Still no data fetching                                                                                                                                             |
| **Organism** | `src/components/organisms` | A distinct section of an interface. `WorkspaceSwitcher`, `DataTable`, `AppHeader`.                               | Composes molecules/atoms. May consume context/hooks. May receive data as props, or fetch its own via a TanStack Query hook ([TANSTACK_QUERY.md](./TANSTACK_QUERY.md) §5) — never a raw `fetch`/`useEffect` |
| **Template** | `src/components/templates` | Layout and slot structure with no real content. `DashboardTemplate`, `AuthTemplate`.                             | Defines regions, accepts `ReactNode` slots. Zero business logic                                                                                                                                            |
| **Page**     | `src/app/**`               | A route. Resolves workspace, composes a template; may fetch page-level data via query hooks.                     | The _only_ tier allowed to know about routing                                                                                                                                                              |

**Dependency direction is one-way and lint-enforced** (`local/tier-boundary`):

```
atoms  <-  molecules  <-  organisms  <-  templates  <-  pages
```

An atom importing another atom is a molecule — move it. This rule sounds pedantic and is
the main thing that stops the library collapsing into an undifferentiated `components/` folder.

`@shared/*` is tier-neutral and importable from anywhere.

## 2. File layout — one component, one folder

```
src/components/atoms/Button/
├── Button.tsx          # the component; named export matches folder + file
├── Button.types.ts     # public props, exported (the manifest reads these)
├── Button.stories.tsx  # required — a component without a story does not exist
├── Button.test.tsx     # behaviour + a11y
└── index.ts            # export { Button } from './Button';
```

Non-negotiable: PascalCase folder = file = export name. Enforced by `pnpm ds:tiers`.
Import via the alias (`@atoms/Button`), never a deep relative path.

## 3. Tokens are the only legal source of value

`design-system/tokens/` → CSS custom properties → Tailwind theme → utility classes.

Three levels, and you only ever use the third:

1. **Primitive** — `--color-blue-500`, `--space-4`. Never referenced in a component.
2. **Semantic** — `--color-fg-default`, `--color-bg-danger-subtle`, `--radius-control`.
   Named for _role_, not appearance. This is what components use.
3. **Component** — `--button-height-md`. Only when a component has a genuinely unique need.

Banned in component code, by lint (`local/no-hardcoded-design-values`,
`local/no-arbitrary-tailwind`):

- hex / `rgb()` / `hsl()` / `oklch()` literals
- Tailwind arbitrary values — `text-[#3b82f6]`, `p-[13px]`, `w-[calc(100%-2rem)]`
- raw px in style objects or template strings
- inline `style={{ }}` for anything a token covers

If you need a value that does not exist, **add it to `theme.json`** and regenerate. The five minutes that costs
is the entire reason the system stays coherent as it grows. Arbitrary values are the
number-one source of drift precisely because they look harmless in review.

Renaming a primitive must never require touching a component. If it does, a component
was reaching past the semantic layer.

## 4. Composition over configuration

A component that has grown a fourth boolean flag is two components.

```tsx
// no — configuration sprawl
<Card showHeader showFooter headerIcon="user" dense collapsible />

// yes — composition
<Card>
  <Card.Header icon={<UserIcon />} />
  <Card.Body />
</Card>
```

Prefer slots (`ReactNode` props) to boolean toggles. Prefer one variant axis with named
values to several booleans that can contradict each other.

## 5. Styling & behaviour rules

- Tailwind utilities in the component; `cn()` from `@shared/lib/cn` to merge.
- Variants via `cva` with the axes fixed in [COMPONENT_CONTRACT.md](./COMPONENT_CONTRACT.md).
- **No external margins.** A component never positions itself; its parent does. This is
  what makes components reusable across layouts.
- `forwardRef` on every atom that wraps a DOM element; spread `...rest` onto it.
- Accessibility is part of the definition of done: keyboard reachable, visible focus
  ring from tokens, correct roles/labels, contrast checked. The a11y addon runs in CI.
- Client components are the default under `src/app/(app)/**`
  ([ADR-0006](./adr/0006-spa-with-tanstack-query.md)) — `'use client'` marks the top of
  that tree once; components below it don't repeat it. Outside the authenticated app
  shell (e.g. `(auth)`), Server Components remain the default.

## 6. Storybook is the source of visual truth

Every component ships a story with: default, every variant, every state
(loading/disabled/error/empty), a long-content case, and RTL/dark where relevant.

Stories are not documentation-as-afterthought — they are what the visual regression
diff runs against, and what a generator reads as a worked example. A component with no
story cannot be reviewed for consistency, and is treated as not existing by the manifest.

## 7. Adding a component

1. `pnpm ds:neighbors "<description>"` — **does this already exist?** Extend before you add.
2. If new: confirm the tier, then scaffold the folder above.
3. Conform to `COMPONENT_CONTRACT.md`. Do not invent a new prop vocabulary.
4. Story + test.
5. Nothing to register — the manifest regenerates from your code on commit. Write a
   real TSDoc description on `<Name>Props`: that is the hand-written unit of truth, and
   it is what `ds:neighbors` searches.
6. `pnpm verify`.

Step 1 is the one that gets skipped and the one that matters most. A library with three
buttons has no design system, however good each button is.
