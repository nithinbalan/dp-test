/**
 * Theme selection: `light`, `dark`, or `system`.
 *
 * The CSS in `design-system/tokens/semantic.css` handles all three states:
 * no `data-theme` attribute follows the OS, an explicit attribute wins in either
 * direction. This module only has to set the attribute and remember the choice.
 */
import { THEMES, type Theme } from '@shared/types/tokens';

export { THEMES, type Theme };

export const THEME_STORAGE_KEY = 'jethur-theme';
export const DEFAULT_THEME: Theme = 'system';

const isTheme = (v: unknown): v is Theme =>
  typeof v === 'string' && (THEMES as readonly string[]).includes(v);

/**
 * Inline script for `<head>`, run before first paint.
 *
 * Without this the page renders in the default theme and then corrects itself once
 * React hydrates — a visible white flash for dark-theme users on every navigation.
 * It has to be blocking and inline; anything deferred is already too late.
 *
 * Kept as a string, not a module, precisely because it must not be bundled.
 */
export const themeInitScript = `(function(){try{
var t=localStorage.getItem('${THEME_STORAGE_KEY}');
if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}
}catch(e){}})();`;

/** Read the stored preference. Returns the default when unset or unreadable. */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    // Private browsing or blocked storage — fall back rather than crash the page.
    return DEFAULT_THEME;
  }
}

/**
 * Apply a theme and persist it. `system` removes the attribute so the CSS
 * `prefers-color-scheme` rules take over again.
 *
 * @returns whether the preference was persisted. Storage can be unavailable
 * (private browsing, blocked cookies) — the current page is still themed
 * correctly, it just will not survive a reload. Returned rather than swallowed so
 * a caller can tell the user if it matters.
 */
export function applyTheme(theme: Theme): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;

  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

/** What the user actually sees right now, resolving `system` against the OS. */
export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
