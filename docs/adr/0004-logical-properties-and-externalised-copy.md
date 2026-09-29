---
id: ADR-0004
title: Logical CSS properties only, and copy passed into components
status: accepted
date: 2026-08-20
affects:
  - src/components
  - src/shared
  - design-system
tags: [i18n, rtl, arabic, accessibility, design-system]
---

# ADR-0004: Logical CSS properties only, and copy passed into components

## Context

The product must ship English (LTR) and Arabic (RTL). Two classes of defect make this
hard, and both share a property that makes them unusually dangerous: **they are
invisible to the people reviewing the code.**

1. Physical direction properties (`ml-4`, `text-left`, `left-0`) look correct in an
   English review and put content on the wrong side in Arabic.
2. Copy welded into markup (`<button>Sign in</button>`) is untranslatable, and the
   English build renders perfectly.

Neither produces an error, a failing test, or a visual glitch in the language the team
reads. Review cannot catch what it cannot see.

## Decision

1. **Logical properties only.** `ms-*`, `text-start`, `border-s`, `marginInlineStart`.
   `local/no-physical-direction` enforces it in TS/TSX; `pnpm ds:rtl` scans
   hand-written CSS. `rtl:` / `ltr:` variants remain allowed for deliberate,
   direction-aware overrides such as mirroring a chevron.
2. **Components receive copy, they do not contain it.** `local/no-literal-ui-text`
   bans JSX text and inline literals in user-facing attributes inside
   `src/components/**`. A named defaults object reaching JSX through a `messages` prop
   is allowed — English defaults for accessibility strings are better than an
   unlabelled control, provided the prop exists so the app can localise it.
3. `dir` and `lang` are server-rendered from the locale, so RTL is correct on first
   paint.
4. `design-system/locales.json` is the single source for locales and direction.

## Consequences

**Good:** one class name is correct in both directions, with no runtime branch;
RTL correctness is a build gate rather than a review burden; components are
translatable by construction; Storybook checks both directions in two clicks.

**Bad / accepted costs:** contributors must learn the logical vocabulary, which is
less familiar than `ml-`/`mr-`; a `messages` prop is more ceremony than inline text
for a component that will only ever be English; English defaults still live in the
component, so a missed `messages` override degrades to English rather than failing
loudly.

**Now harder to change:** adopting a component library that hardcodes physical
properties would require wrapping or forking it.

## Alternatives considered

| Option                                              | Why not                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| PostCSS RTL plugin generating mirrored stylesheets  | Doubles CSS, and breaks down for inline styles and JS-computed positions                                                       |
| Review checklist for RTL                            | The defect is invisible to reviewers who do not read Arabic — a checklist cannot fix an observation problem                    |
| A full i18n library (next-intl, i18next) now        | Premature: the base needs the _boundary_ right first. Externalised copy is what makes adopting one later a swap, not a rewrite |
| Allowing English text with a "translate later" TODO | "Later" never arrives, and by then it is in 200 components                                                                     |

## Revisit when

A translation library is adopted — at that point `messages` props become the
integration seam, and the defaults may move into message catalogues.
