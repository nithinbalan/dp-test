# Component API Contract

**A fixed prop vocabulary. One concept, one name, everywhere.**

Most UI inconsistency is not visual — it is lexical. One component takes `variant`, the
next takes `type`, a third takes `kind`, a fourth takes `appearance`. All four mean the
same thing. Consumers then guess, autocomplete stops helping, and every new component
becomes a small research task. This file closes the vocabulary.

**Single source of truth: `design-system/contract.json`.** The tables in §1 are
GENERATED from it by `pnpm ds:manifest` — edit the JSON, never the tables. The same
file is projected into `design-system/manifest.json` and into every generation prompt,
so there is exactly one place this vocabulary is defined and no copy that can drift.

The prose in this file is human-owned: it explains _why_. The tables are the _what_.

---

## 1. The prop vocabulary

These names have **exactly one meaning** in this codebase. Never redefine them, never
substitute a synonym.

<!-- GENERATED:contract — do not edit below. Edit design-system/contract.json, then run `pnpm ds:manifest`. -->

### Reserved prop names

| Prop            | Type                      | Meaning                                                                                           |
| --------------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `variant`       | `'solid'                  | 'soft'                                                                                            | 'outline'                                                                              | 'ghost'                                                                                                                                 | 'link'    | 'inline'  | 'trigger' | 'joined' | 'split'`                                                                                                                                                                     | visual weight / emphasis. `inline` and `trigger` are presentation modes (as opposed to weight) used by pickers with more than one interaction shape — e.g. PeoplePicker's pill-and-search vs. combobox-button-and-popover. `joined`/`split` are SegmentedControl's container treatment: one shared bordered pill with no gaps between segments, vs. each segment as its own bordered button with a gap — used when a multi-tone answer control (Yes/Partly/No/Not sure) needs each choice to read as a standalone decision rather than one rung of a single switch. |
| `size`          | `'none'                   | '2xs'                                                                                             | 'xs'                                                                                   | 'sm'                                                                                                                                    | 'md'      | 'lg'      | 'xl'      | '2xl'`   | scale. `none` means the property this scales is switched off entirely (a Card with no padding, so a table can meet its edges) — it is not a synonym for `xs`. (default `md`) |
| `tone`          | `'neutral'                | 'muted'                                                                                           | 'subtle'                                                                               | 'strong'                                                                                                                                | 'inverse' | 'current' | 'brand'   | 'accent' | 'success'                                                                                                                                                                    | 'warning'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 'danger' | 'info'` | semantic intent. Two families, and mixing them up is the mistake to watch for. SEMANTIC: brand, accent, success, warning, danger, info — what the thing MEANS. `accent` is the lime highlight: deliberate emphasis only, never a second primary. EMPHASIS: neutral (default weight), muted, subtle, strong, inverse (on a dark surface), current (inherit the surrounding colour) — how loud the thing is when it means nothing in particular. There is no `default`: `neutral` is the default, and having both would be one concept with two names. (default `neutral`) |
| `isDisabled`    | `boolean`                 | interaction disabled                                                                              |
| `isLoading`     | `boolean`                 | async work in flight                                                                              |
| `isInvalid`     | `boolean`                 | failed validation                                                                                 |
| `isRequired`    | `boolean`                 | required field                                                                                    |
| `isReadOnly`    | `boolean`                 | visible, not editable                                                                             |
| `fullWidth`     | `boolean`                 | fills container inline axis                                                                       |
| `startSlot`     | `ReactNode`               | leading content                                                                                   |
| `endSlot`       | `ReactNode`               | trailing content                                                                                  |
| `label`         | `string`                  | primary visible text                                                                              |
| `description`   | `string`                  | secondary helper text                                                                             |
| `errorMessage`  | `string`                  | shown when isInvalid                                                                              |
| `onValueChange` | `(value: T) => void`      | semantic change, passes value not event                                                           |
| `onOpenChange`  | `(open: boolean) => void` | disclosure state                                                                                  |
| `asChild`       | `boolean`                 | render as child element                                                                           |
| `className`     | `string`                  | merged via cn(), always accepted                                                                  |
| `testId`        | `string`                  | maps to data-testid                                                                               |
| `shape`         | `'rounded'                | 'circle'                                                                                          | 'square'`                                                                              | outline of a container whose silhouette is meaningful (avatar, icon button). NOT visual weight — that is `variant`. (default `rounded`) |
| `orientation`   | `'horizontal'             | 'vertical'`                                                                                       | layout axis. Resolves logically, so `horizontal` follows `dir`. (default `horizontal`) |
| `value`         | `T`                       | controlled value; pairs with `onValueChange`                                                      |
| `defaultValue`  | `T`                       | uncontrolled initial value                                                                        |
| `isSelected`    | `boolean`                 | controlled on/off for a two-state control (switch, chip, checkbox)                                |
| `messages`      | `Partial<TMessages>`      | translatable copy. Defaults are English; the prop is what makes the component localisable at all. |

### Banned names — rejected by `pnpm ds:check`

`kind` · `appearance` · `color` · `colour` · `theme` · `status` · `intent` · `scale` · `sizing` · `disabled` · `loading` · `invalid` · `required` · `readOnly` · `leftIcon` · `rightIcon` · `prefix` · `suffix` · `onChangeValue` · `text` · `title` · `caption` · `mt` · `mb` · `ml` · `mr` · `margin` · `spacing` · `inputProps` · `wrapperProps` · `containerProps`

**Exceptions:**

- `type` — Legal ONLY as a native DOM attribute passthrough (input/button type). Never for visual style — use `variant`.
- `disabled` — Use `isDisabled`. Native `disabled` still reaches the DOM element via prop spreading.

### Boolean prefixes

`is` · `has` · `can` · `should` · `allow`

### Required files per component

`<Name>.tsx` · `<Name>.types.ts` · `<Name>.stories.tsx` · `<Name>.test.tsx` · `index.ts`

<!-- /GENERATED:contract -->

## 2. Boolean naming

Booleans are `is*`, `has*`, `can*`, `should*`, or `allow*`. They default to `false`,
and the `false` state is always the safe/normal one. Never `isNotX` or `hideX` — negated
booleans force double-negative reasoning at every call site.

## 3. Handler naming

`on<Thing><Event>` on the component; `handle<Thing><Event>` for the implementation.
Semantic handlers pass the value (`onValueChange(next)`), DOM passthroughs pass the
event (`onClick(e)`). Never both on the same concept.

## 4. Required shape for every component

```ts
// Button.types.ts
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type ButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'className'> & {
  /** Visual weight. @default 'solid' */
  variant?: 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Semantic intent. @default 'neutral' */
  tone?: 'neutral' | 'brand' | 'danger';
  isLoading?: boolean;
  startSlot?: ReactNode;
  className?: string;
  testId?: string;
};
```

Rules:

1. Props type lives in `<Name>.types.ts` and is **exported** — the manifest generator
   reads it, and consumers extend it.
2. Extend the native element props; never re-declare `onClick`, `id`, `aria-*` by hand.
3. Every prop carries a TSDoc line. Every optional prop states its `@default`.
4. Union literals, never `string`. `variant?: string` defeats the entire contract.
   4b. **Optional props are declared `?: T | undefined`.** `exactOptionalPropertyTypes` is
   on ([ADR-0003](./adr/0003-exact-optional-property-types.md)), so without the explicit
   `| undefined` a consumer cannot forward an optional value — they get an opaque
   `TS2375` at the call site. `pnpm ds:check` enforces this at the definition instead.
5. No `any`. No `object`. No `Function`.
6. A component takes a **subset** of the vocabulary — it never needs all of it — but it
   may not take a name outside it without adding that name to this file first.

## 5. Defaults

`size` defaults to `md`. `tone` defaults to `neutral`. `variant` defaults to the most
common usage for that component. Defaults are set in destructuring, not in `cva` only,
so they are visible in the signature.

## 6. Composition & polymorphism

- Compound components use dot notation (`Card.Header`) with a shared context.
- Polymorphism uses `asChild`, not an `as` prop — `as` breaks prop typing at scale.
- Slots are `ReactNode`, not render props, unless the child genuinely needs parent state.

## 7. What is _not_ allowed in a component's API

- Anything workspace-, tenant-, auth-, or route-aware below the page tier. Data comes in
  as props. A `Button` that knows about `workspaceId` is a bug.
- Fetching, `useRouter`, `cookies()`, or environment access in atoms/molecules.
- External margin props (`mt`, `mb`, `spacing`). Parents own spacing.
- Passthrough grab-bags: `inputProps`, `wrapperProps`, `containerProps`. Use slots.

## 8. Adding to the vocabulary

Requires: a PR to this file, the `contract` block in `design-system/manifest.json`
updated, and a reason no existing name fits. Adding a synonym for an existing concept is
refused. The vocabulary is small on purpose — that is what makes it memorable, and a
vocabulary nobody can recite is not a contract.
