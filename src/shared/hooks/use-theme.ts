'use client';

/**
 * Read and change the active theme.
 *
 * Theme is EXTERNAL state — it lives in `localStorage`, on the document element,
 * and in the OS preference — so it is read with `useSyncExternalStore` rather than
 * mirrored into `useState` from an effect. That avoids the cascading render the
 * setState-in-effect pattern causes, and gives correct hydration for free:
 * `getServerSnapshot` returns `null`, so the server and the first client render
 * agree, and the real value arrives immediately after.
 *
 * Consumers must handle `theme === null` by rendering a placeholder. The server
 * cannot know a client's stored preference, so any definite state during SSR is a
 * guaranteed hydration mismatch.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { applyTheme, getStoredTheme, THEME_STORAGE_KEY, type Theme } from '@shared/lib/theme';

export type UseThemeResult = {
  /** null until hydrated on the client. */
  theme: Theme | null;
  /** What is actually displayed, with `system` resolved against the OS. */
  resolved: 'light' | 'dark' | null;
  setTheme: (theme: Theme) => void;
};

/** Local subscribers, so a change in one component updates every other instance. */
const listeners = new Set<() => void>();
const emit = () => {
  for (const listener of listeners) listener();
};

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const media = window.matchMedia(DARK_QUERY);
  // `storage` fires for other tabs; the media query for OS-level changes.
  window.addEventListener('storage', onChange);
  media.addEventListener('change', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
    media.removeEventListener('change', onChange);
  };
}

/**
 * One string encodes both facts, because `useSyncExternalStore` requires a
 * referentially stable snapshot — returning a fresh object every call would loop.
 */
function getSnapshot(): string {
  const stored = getStoredTheme();
  const systemDark = window.matchMedia(DARK_QUERY).matches;
  return `${stored}|${systemDark ? 'dark' : 'light'}`;
}

const getServerSnapshot = (): null => null;

export function useTheme(): UseThemeResult {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    emit();
  }, []);

  if (snapshot === null) return { theme: null, resolved: null, setTheme };

  const [theme, system] = snapshot.split('|') as [Theme, 'light' | 'dark'];
  return {
    theme,
    resolved: theme === 'system' ? system : theme,
    setTheme,
  };
}

export { THEME_STORAGE_KEY };
