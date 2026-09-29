---
id: ADR-0003
title: Keep exactOptionalPropertyTypes, declare component props as `?: T | undefined`
status: accepted
date: 2026-08-20
affects:
  - src/components
  - tsconfig.json
tags: [typescript, components, dx]
---

# ADR-0003: Keep `exactOptionalPropertyTypes`, declare component props as `?: T | undefined`

## Context

`exactOptionalPropertyTypes` distinguishes "property absent" from "property explicitly
`undefined`". That distinction is genuinely valuable in the server and data layers — a
patch object with `{ workspaceId: undefined }` means something different from one without
the key, and conflating them writes nulls nobody intended.

It is friction in React components, where forwarding an optional prop is idiomatic:

```tsx
<Button className={className} /> // className: string | undefined
```

...fails with an opaque `TS2375` if `Button` declares `className?: string`. This affects
every component that forwards optional props, which is nearly all of them.

## Decision

Keep `exactOptionalPropertyTypes: true` globally. Component prop types declare optional
props explicitly as `?: T | undefined`.

`pnpm ds:check` enforces this and reports it in contract language, rather than letting
each consumer discover it as a TS2375 at the call site.

## Consequences

**Good:** strictness retained where it catches real bugs (server, data, config);
forwarding works naturally in components; the failure is reported once, at the definition,
with an actionable message.

**Bad / accepted costs:** optional prop declarations are more verbose; the generated
manifest shows `| undefined` in prop types, which is noise when reading the registry.

**Now harder to change:** turning the flag off later would leave the `| undefined`
annotations as harmless but redundant noise across every props file.

## Alternatives considered

| Option                                       | Why not                                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Turn `exactOptionalPropertyTypes` off        | Loses a real correctness check in the data layer to solve a component-layer ergonomics problem  |
| Spread props conditionally at each call site | Unreadable, and the mistake is invisible until runtime                                          |
| A wrapper type (`Optional<T>`)               | Hides the mechanism, and the generated manifest would show the alias rather than the real shape |

## Revisit when

TypeScript gains a way to scope the flag per-directory, or React prop forwarding stops
being the dominant pattern.
