# Theming

**Every visual value in the product comes from one file: `design-system/theme.json`.**

Colours, both themes, radii, spacing, type, shadows and motion. Nothing else is
hand-written — `pnpm ds:tokens` generates the CSS, the Tailwind theme and the TypeScript
token types from it, and CI fails if the generated files drift.

---

## Rebranding is one number

```jsonc
// design-system/theme.json
"palettes": {
  "brand": { "hue": 250, "chroma": 0.19 }   // <- change this
}
```

```bash
pnpm ds:tokens
```

Both themes, all 13 steps, every semantic role and every utility class update together.

This works because palettes are authored in **OKLCH**, which is perceptually uniform:
changing hue while holding lightness and chroma keeps the _apparent_ weight of the colour
constant. The same swap in HSL silently changes how dark the colour looks, which is why
rebrands there turn into redesigns.

`chroma` is saturation. The generator **fits it to sRGB automatically** — some hues cannot
hold high chroma at some lightnesses, and without fitting the browser clips silently, so
the rendered colour would not be the one the token claims.

## The three layers

| Layer     | Prefix | Example           | Who uses it              |
| --------- | ------ | ----------------- | ------------------------ |
| Primitive | `--p-` | `--p-brand-700`   | nobody — generated ramps |
| Semantic  | `--s-` | `--s-brand-solid` | hand-written CSS only    |
| Utility   | —      | `bg-brand-solid`  | **components**           |

Components use utilities. They never name a palette or a step, which is what lets the
brand change without touching a component.

The prefixes are not decoration: `@theme inline { --color-x: var(--color-x) }` emits a
self-reference that resolves only by source-order luck. Distinct layers make the collision
impossible.

## Light and dark

`theme.json` defines **both** themes explicitly. Every role appears in both — the
generator emits them together, so a role cannot silently keep its light value in dark
mode. (Before this was generated, 16 of 29 roles did exactly that.)

Three CSS states, all generated:

| User state  | Selector                                        | Result                   |
| ----------- | ----------------------------------------------- | ------------------------ |
| No choice   | `:root` + `@media (prefers-color-scheme: dark)` | follows the OS           |
| Chose dark  | `:root[data-theme='dark']`                      | dark, even on a light OS |
| Chose light | `:root[data-theme='light']`                     | light, even on a dark OS |

The explicit selectors matter: with only a `prefers-color-scheme` block, a user on a
light-preferring OS **cannot switch to dark at all**.

`color-scheme` is set alongside, so native scrollbars, form controls and the caret follow
the theme too.

### In the app

- `themeInitScript` runs in `<head>` before first paint. Without it, dark-theme users see
  a white flash on every navigation while React hydrates.
- `useTheme()` from `@shared/hooks` reads and sets the preference.
- `<ThemeToggle />` cycles light → dark → system.

`useTheme` returns `theme: null` until mounted. The server cannot know a client's stored
preference, so rendering a definite state during SSR guarantees a hydration mismatch —
render a placeholder while it is null. `ThemeToggle` does this.

## Contrast is a build gate, not a review note

`theme.json` declares the pairs that must stay legible:

```jsonc
"pairs": [
  ["fg-default", "bg-canvas", "text"],      // >= 4.5:1
  ["fg-on-brand", "brand-solid", "text"],
  ["border-strong", "bg-canvas", "ui"]      // >= 3:1
]
```

`pnpm ds:tokens --check` computes real WCAG ratios for every pair **in both themes** and
fails the build on a violation. This is what makes changing a hue safe: if a rebrand makes
button text unreadable, you find out in CI rather than from a user.

It is strict — 2.99:1 fails a 3:1 requirement. That is deliberate; a threshold you round
up to is not a threshold.

Adding a semantic role means adding its contrast pair. An unchecked pair is an
accessibility regression waiting for a palette change.

## Adding a role

1. Add it to **both** `semantic.light` and `semantic.dark` in `theme.json`.
2. Add a contrast pair for it.
3. `pnpm ds:tokens`.
4. Use `bg-<role>` / `text-<role>` in components. `ColorRole` in
   `@shared/types/tokens` updates automatically, so a typo fails to compile.

## What you must never do

- Edit `design-system/tokens/*.css` — generated, and CI will fail.
- Reference `--p-*` from a component. Primitives are not themeable; that is the whole point.
- Use a hex, `rgb()`, or an arbitrary Tailwind value. Lint-banned — see
  [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).
- Add a role to one theme only. Both, or neither.
