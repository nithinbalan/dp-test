<!-- GENERATED:tier — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# atoms

> Auto-loaded when you work in `src/components/atoms`. Generated index — edit the
> components, not this file. Notes of your own go below the end marker.

No other components. No app state. No data fetching. No external margins.

Dependency direction: `atoms <- molecules <- organisms <- templates <- pages`

## Decisions that constrain this code

- [ADR-0002](../../../docs/adr/0002-single-app-not-monorepo.md) — Single Next.js app, boundaries enforced by lint `accepted`
- [ADR-0003](../../../docs/adr/0003-exact-optional-property-types.md) — Keep exactOptionalPropertyTypes, declare component props as `?: T | undefined` `accepted`
- [ADR-0004](../../../docs/adr/0004-logical-properties-and-externalised-copy.md) — Logical CSS properties only, and copy passed into components `accepted`
- [ADR-0006](../../../docs/adr/0006-spa-with-tanstack-query.md) — Client-rendered SPA on Next.js, TanStack Query as the data layer `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## What exists (20)

### action

| Component                                   | Does                                                 |
| ------------------------------------------- | ---------------------------------------------------- |
| [`Button`](./Button/Button.tsx)             | Trigger for a user action.                           |
| [`IconButton`](./IconButton/IconButton.tsx) | Square action control whose only content is an icon. |

### feedback

| Component                             | Does                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| [`Progress`](./Progress/Progress.tsx) | Determinate progress along a known range — a completion score, an upload, a   |
| [`Skeleton`](./Skeleton/Skeleton.tsx) | Placeholder shaped like the content that is about to replace it.              |
| [`Spinner`](./Spinner/Spinner.tsx)    | Indeterminate busy indicator — work is happening and its duration is unknown. |

### filter

| Component                 | Does                      |
| ------------------------- | ------------------------- |
| [`Chip`](./Chip/Chip.tsx) | Two-state filter control. |

### form

| Component                             | Does                                    |
| ------------------------------------- | --------------------------------------- |
| [`Checkbox`](./Checkbox/Checkbox.tsx) | Independent on/off choice.              |
| [`Input`](./Input/Input.tsx)          | Single-line text entry control.         |
| [`Label`](./Label/Label.tsx)          | Caption for a form control.             |
| [`Radio`](./Radio/Radio.tsx)          | One option in a mutually exclusive set. |
| [`Select`](./Select/Select.tsx)       | Choice from a short, known list.        |
| [`Switch`](./Switch/Switch.tsx)       | Setting that takes effect immediately.  |
| [`Textarea`](./Textarea/Textarea.tsx) | Multi-line text entry.                  |

### identity

| Component                       | Does                                       |
| ------------------------------- | ------------------------------------------ |
| [`Avatar`](./Avatar/Avatar.tsx) | Identity mark for a person or a workspace. |

### layout

| Component                          | Does                                                           |
| ---------------------------------- | -------------------------------------------------------------- |
| [`Card`](./Card/Card.tsx)          | The product's default surface: a bordered panel on the canvas. |
| [`Divider`](./Divider/Divider.tsx) | Rule between groups of content.                                |

### navigation

| Component                 | Does                 |
| ------------------------- | -------------------- |
| [`Link`](./Link/Link.tsx) | Navigational anchor. |

### status

| Component                    | Does                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------- |
| [`Badge`](./Badge/Badge.tsx) | Compact, non-interactive status marker — a record's state, a severity, a count, |

### typography

| Component                          | Does                                               |
| ---------------------------------- | -------------------------------------------------- |
| [`Heading`](./Heading/Heading.tsx) | Section title.                                     |
| [`Text`](./Text/Text.tsx)          | Body copy at a token-backed size, weight and tone. |

**Props are not listed here on purpose.** Read `<Name>/<Name>.types.ts` — it is
shorter than a generated table and cannot be out of date. `pnpm ctx:find "<task>"`
searches every tier at once and pulls the nearest sources for you.

<!-- /GENERATED:tier -->

## Notes

<!-- HUMAN-OWNED. Conventions specific to atoms that the generated index cannot know:
     patterns to follow, traps people hit, components that look similar but are not. -->

### Pairs that look like duplicates and are not

| These two                | Differ by                                                                                                                                     |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `Badge` vs `Chip`        | A Badge is inert; a Chip toggles a filter and owns `aria-pressed`. If the user can press it, it is a Chip.                                    |
| `Checkbox` vs `Switch`   | A Checkbox states an intention a Save button later commits. A Switch **is** the commit. Wrong choice = "I pressed Save and nothing happened". |
| `Button` vs `IconButton` | `IconButton` requires `label`. That is the point: an icon-only Button has no accessible name and nothing in review reveals it.                |
| `Spinner` vs `Progress`  | Spinner when the end is unknown. Progress when it is. A spinner that runs 11 seconds says nothing.                                            |
| `Text` vs `Heading`      | Heading keeps `level` (outline) separate from `size` (scale). Never demote an h2 to h4 to make it smaller.                                    |

### Traps

- **`cn()` concatenates, it does not merge.** There is no tailwind-merge yet, so
  `cn('h-9', 'h-auto')` resolves by stylesheet order, not by argument order. Where two
  values of one property are possible, use two separate lookup maps — `Button` does this
  for `link` sizing.
- **Native-first for form controls.** `Checkbox`, `Radio` and `SegmentedControl` hide a
  real input rather than replacing it, which is where arrow-key movement, form
  participation and `:checked` come from. Hide with `sr-only`, never `hidden` or
  `display:none` — that removes the behaviour the input was kept for.
- **One prop, one truth.** `Field` derives `isInvalid` from `errorMessage` rather than
  taking both. Two props for one state ship as red-with-no-message.
- **Two tone families.** `brand/accent/success/warning/danger/info` mean something;
  `neutral/muted/subtle/strong/inverse/current` are only emphasis. Do not add a semantic
  value to a component whose variation is really emphasis, or the reverse.
- **`accent` is not a second primary.** It is the lime. One deliberate mark per screen.
- Sizes align across controls on purpose: `md` is `h-9` for Button, Input, Select and
  IconButton, so they line up in a toolbar without anyone nudging heights.
