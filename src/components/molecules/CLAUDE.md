<!-- GENERATED:tier — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# molecules

> Auto-loaded when you work in `src/components/molecules`. Generated index — edit the
> components, not this file. Notes of your own go below the end marker.

Composes atoms only. Local UI state allowed. No data fetching.

Dependency direction: `atoms <- molecules <- organisms <- templates <- pages`

## Decisions that constrain this code

- [ADR-0002](../../../docs/adr/0002-single-app-not-monorepo.md) — Single Next.js app, boundaries enforced by lint `accepted`
- [ADR-0003](../../../docs/adr/0003-exact-optional-property-types.md) — Keep exactOptionalPropertyTypes, declare component props as `?: T | undefined` `accepted`
- [ADR-0004](../../../docs/adr/0004-logical-properties-and-externalised-copy.md) — Logical CSS properties only, and copy passed into components `accepted`
- [ADR-0006](../../../docs/adr/0006-spa-with-tanstack-query.md) — Client-rendered SPA on Next.js, TanStack Query as the data layer `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## What exists (22)

### data-display

| Component                                | Does                                                                |
| ---------------------------------------- | ------------------------------------------------------------------- |
| [`ScoreRing`](./ScoreRing/ScoreRing.tsx) | Circular readiness/compliance score — the hero visual on Dashboard, |
| [`StatCard`](./StatCard/StatCard.tsx)    | One number and what it means.                                       |
| [`Table`](./Table/Table.tsx)             | Tabular data, as a real `<table>`.                                  |

### feedback

| Component                                   | Does                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| [`Alert`](./Alert/Alert.tsx)                | Inline message about the region it sits in — a validation summary, a warning |
| [`EmptyState`](./EmptyState/EmptyState.tsx) | What a region shows when it has nothing to show.                             |

### form

| Component                                                     | Does                                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`Field`](./Field/Field.tsx)                                  | Label + control + helper text + error message, wired together.                 |
| [`Listbox`](./Listbox/Listbox.tsx)                            | Single-select from a short, known list, presented as a custom-rendered         |
| [`LoginForm`](./LoginForm/LoginForm.tsx)                      | Email + password sign-in form.                                                 |
| [`OtpInput`](./OtpInput/OtpInput.tsx)                         | One-time-passcode entry: a row of single-digit cells that behaves like one     |
| [`PasswordInput`](./PasswordInput/PasswordInput.tsx)          | A password field with a show/hide toggle.                                      |
| [`PeoplePicker`](./PeoplePicker/PeoplePicker.tsx)             | Searchable single-select for assigning an owner from a known people list —     |
| [`SearchInput`](./SearchInput/SearchInput.tsx)                | Filter box for a list or table.                                                |
| [`SegmentedControl`](./SegmentedControl/SegmentedControl.tsx) | Single choice from two to five options, all visible at once — a view switcher, |
| [`TagPicker`](./TagPicker/TagPicker.tsx)                      | Multi-select from a short list of tags, each independently toggleable —        |
| [`WorkspaceField`](./WorkspaceField/WorkspaceField.tsx)       | Workspace-subdomain entry.                                                     |

### i18n

| Component                                               | Does                           |
| ------------------------------------------------------- | ------------------------------ |
| [`LocaleSwitcher`](./LocaleSwitcher/LocaleSwitcher.tsx) | Lets the user change language. |

### layout

| Component                                   | Does                                                                |
| ------------------------------------------- | ------------------------------------------------------------------- |
| [`PageHeader`](./PageHeader/PageHeader.tsx) | The header every module screen opens with: an optional legal/module |

### navigation

| Component                                      | Does                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| [`Breadcrumbs`](./Breadcrumbs/Breadcrumbs.tsx) | Trail from the workspace root to the current page.                              |
| [`Pagination`](./Pagination/Pagination.tsx)    | Page navigation for a list that does not fit on one screen.                     |
| [`Stepper`](./Stepper/Stepper.tsx)             | Progress through a wizard: which steps are done, which one you are on, how many |
| [`Tabs`](./Tabs/Tabs.tsx)                      | Tab strip for switching between panels of the same page.                        |

### theme

| Component                                      | Does                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------- |
| [`ThemeToggle`](./ThemeToggle/ThemeToggle.tsx) | Cycles the colour theme between light, dark and following the OS. |

**Props are not listed here on purpose.** Read `<Name>/<Name>.types.ts` — it is
shorter than a generated table and cannot be out of date. `pnpm ctx:find "<task>"`
searches every tier at once and pulls the nearest sources for you.

<!-- /GENERATED:tier -->

## Notes

<!-- HUMAN-OWNED. Conventions specific to molecules that the generated index cannot know:
     patterns to follow, traps people hit, components that look similar but are not. -->

### What these deliberately do NOT do

They take data and report intent. Sorting, selection, fetching and pagination _state_
belong to an organism or the page above them:

- `Table` renders rows. A sortable, selectable, paginated table is an organism built on it.
- `Tabs` renders the strip only — the caller renders the panel and wires it with
  `tabPanelProps()`. That split is what lets a panel be a server component or a route.
- `Pagination` reports the page asked for; it does not know how many rows exist.
- `SearchInput` is controlled. A search box the parent cannot read cannot filter anything.

### Traps

- **`Field` takes a function as `children`.** It generates the ids and hands them to the
  control. Do not "simplify" it to `cloneElement`: that breaks the moment someone wraps
  their input in a fragment, and the breakage is a missing accessible name that nobody
  sees.
- **Three empties, one component.** Nothing-created-yet (offer the action), nothing-matched
  (offer to clear the filter), failed-to-load (offer retry). `EmptyState` cannot tell them
  apart — the caller must, and the copy is the whole value.
- **Arrow keys are physical; reading order is logical.** `Tabs` maps them through
  `useDirection()`. Any new roving-focus component must do the same — this is the one case
  a CSS logical property cannot solve.
- **`flex-1` vs `grow` in a row of unequal labels.** `flex-1` is `flex: 1 1 0%` and gives
  every item the same box, so the long label clips while the short one has room spare.
  `Stepper` uses `grow`. Watch for this in any toolbar-like row.
- **Tone chooses urgency, not just colour.** `Alert` renders `role="alert"` for
  danger/warning and `role="status"` otherwise, so a failed save interrupts and a success
  note does not.
