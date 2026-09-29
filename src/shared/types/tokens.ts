/* GENERATED from design-system/theme.json by `pnpm ds:tokens`. Do not edit. */

/**
 * Token names as types. Lets a component accept a token reference without
 * accepting an arbitrary string, so a typo fails to compile instead of silently
 * resolving to nothing at runtime.
 */

export type ColorRole =
  | 'bg-canvas'
  | 'bg-surface'
  | 'bg-raised'
  | 'bg-subtle'
  | 'bg-subtle-hover'
  | 'bg-hover'
  | 'bg-inverse'
  | 'bg-inverse-subtle'
  | 'fg-default'
  | 'fg-muted'
  | 'fg-subtle'
  | 'fg-inverse'
  | 'fg-inverse-subtle'
  | 'fg-on-brand'
  | 'fg-on-accent'
  | 'fg-on-danger'
  | 'fg-on-warning'
  | 'border-default'
  | 'border-strong'
  | 'border-inverse'
  | 'border-focus'
  | 'brand-solid'
  | 'brand-solid-hover'
  | 'brand-subtle'
  | 'brand-subtle-hover'
  | 'brand-fg'
  | 'accent-solid'
  | 'accent-solid-hover'
  | 'accent-subtle'
  | 'accent-subtle-hover'
  | 'accent-fg'
  | 'success-solid'
  | 'success-subtle'
  | 'success-subtle-hover'
  | 'success-fg'
  | 'warning-solid'
  | 'warning-subtle'
  | 'warning-subtle-hover'
  | 'warning-fg'
  | 'danger-solid'
  | 'danger-solid-hover'
  | 'danger-subtle'
  | 'danger-subtle-hover'
  | 'danger-fg'
  | 'info-solid'
  | 'info-subtle'
  | 'info-subtle-hover'
  | 'info-fg';

export type RadiusToken =
  'control' | 'surface' | 'pill' | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type SpaceToken = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16' | '20';

export type FontSizeToken = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** The two explicit themes, plus following the OS. */
export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Browser chrome colour per theme (the `theme-color` meta tag).
 * Generated so the address bar cannot drift from the canvas it sits above —
 * and so no component file needs a literal colour, which lint forbids.
 */
export const THEME_COLOR = {
  light: 'oklch(0.9725 0.0067 97.4)',
  dark: 'oklch(0.13 0.0051 136)',
} as const;

/** Palette names, for tooling and documentation. */
export const PALETTES = [
  'brand',
  'accent',
  'neutral',
  'success',
  'warning',
  'danger',
  'info',
] as const;
