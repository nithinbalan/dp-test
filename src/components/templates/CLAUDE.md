<!-- GENERATED:tier — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# templates

> Auto-loaded when you work in `src/components/templates`. Generated index — edit the
> components, not this file. Notes of your own go below the end marker.

Layout and ReactNode slots only. Zero business logic.

Dependency direction: `atoms <- molecules <- organisms <- templates <- pages`

## Decisions that constrain this code

- [ADR-0002](../../../docs/adr/0002-single-app-not-monorepo.md) — Single Next.js app, boundaries enforced by lint `accepted`
- [ADR-0003](../../../docs/adr/0003-exact-optional-property-types.md) — Keep exactOptionalPropertyTypes, declare component props as `?: T | undefined` `accepted`
- [ADR-0004](../../../docs/adr/0004-logical-properties-and-externalised-copy.md) — Logical CSS properties only, and copy passed into components `accepted`
- [ADR-0006](../../../docs/adr/0006-spa-with-tanstack-query.md) — Client-rendered SPA on Next.js, TanStack Query as the data layer `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## What exists (3)

| Component                                      | Does                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------ |
| [`AppShell`](./AppShell/AppShell.tsx)          | Structure for every signed-in screen: a fixed sidebar, a topbar, and a         |
| [`AuthShell`](./AuthShell/AuthShell.tsx)       | Two-pane layout for an authentication page: a filled panel on one side (brand, |
| [`WizardShell`](./WizardShell/WizardShell.tsx) | Structure for a multi-step flow: a step rail, the current step's content,      |

**Props are not listed here on purpose.** Read `<Name>/<Name>.types.ts` — it is
shorter than a generated table and cannot be out of date. `pnpm ctx:find "<task>"`
searches every tier at once and pulls the nearest sources for you.

<!-- /GENERATED:tier -->

## Notes

<!-- HUMAN-OWNED. Conventions specific to templates that the generated index cannot know:
     patterns to follow, traps people hit, components that look similar but are not. -->
