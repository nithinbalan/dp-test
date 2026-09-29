<!-- GENERATED:tier — do not edit. Rewritten by `pnpm ctx`. Write your notes BELOW the end marker. -->

# organisms

> Auto-loaded when you work in `src/components/organisms`. Generated index — edit the
> components, not this file. Notes of your own go below the end marker.

Composes molecules/atoms. May consume context. Receives data, does not fetch (unless RSC).

Dependency direction: `atoms <- molecules <- organisms <- templates <- pages`

## Decisions that constrain this code

- [ADR-0002](../../../docs/adr/0002-single-app-not-monorepo.md) — Single Next.js app, boundaries enforced by lint `accepted`
- [ADR-0003](../../../docs/adr/0003-exact-optional-property-types.md) — Keep exactOptionalPropertyTypes, declare component props as `?: T | undefined` `accepted`
- [ADR-0004](../../../docs/adr/0004-logical-properties-and-externalised-copy.md) — Logical CSS properties only, and copy passed into components `accepted`
- [ADR-0006](../../../docs/adr/0006-spa-with-tanstack-query.md) — Client-rendered SPA on Next.js, TanStack Query as the data layer `accepted`

Changing behaviour these decisions assume means superseding the ADR, not working around it.

## What exists (5)

### authentication

| Component                             | Does                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| [`AuthCard`](./AuthCard/AuthCard.tsx) | The full sign-in experience: email/password with a workspace field, "Sign in |

### chat

| Component                                | Does                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| [`ChatPanel`](./ChatPanel/ChatPanel.tsx) | A chat transcript with an input row — the shape a knowledge-base assistant, |

### navigation

| Component                                   | Does                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| [`AppSidebar`](./AppSidebar/AppSidebar.tsx) | Primary navigation for the signed-in app: brand mark, a highlighted entry |
| [`AppTopbar`](./AppTopbar/AppTopbar.tsx)    | Top bar for the signed-in app: mobile nav toggle, the current workspace,  |

### overlay

| Component                       | Does                                                                   |
| ------------------------------- | ---------------------------------------------------------------------- |
| [`Dialog`](./Dialog/Dialog.tsx) | Modal overlay for a focused task that shouldn't navigate away from the |

**Props are not listed here on purpose.** Read `<Name>/<Name>.types.ts` — it is
shorter than a generated table and cannot be out of date. `pnpm ctx:find "<task>"`
searches every tier at once and pulls the nearest sources for you.

<!-- /GENERATED:tier -->

## Notes

<!-- HUMAN-OWNED. Conventions specific to organisms that the generated index cannot know:
     patterns to follow, traps people hit, components that look similar but are not. -->
