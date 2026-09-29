'use client';

/**
 * @tier molecules
 *
 * Composes Button (an atom) and the shared useTheme hook. It owns local UI state
 * only — the theme itself lives on the document element and in localStorage.
 */
import { Button } from '@atoms/Button';
import { useTheme } from '@shared/hooks';
import { type Theme } from '@shared/types/tokens';
import type { ThemeToggleMessages, ThemeToggleProps } from './ThemeToggle.types';

const ORDER: readonly Theme[] = ['light', 'dark', 'system'];
const GLYPH: Record<Theme, string> = { light: '☀', dark: '☾', system: '◐' };

/** English DEFAULTS, overridable via `messages` — not copy embedded in markup. */
const DEFAULT_MESSAGES: ThemeToggleMessages = {
  label: 'Change theme',
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export function ThemeToggle({
  size = 'md',
  messages,
  onValueChange,
  className,
  testId,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const t = { ...DEFAULT_MESSAGES, ...messages };

  // Until mounted, `theme` is null: the server cannot know the stored preference,
  // so committing to one here would guarantee a hydration mismatch.
  if (theme === null) {
    return (
      <Button
        variant="ghost"
        size={size}
        aria-label={t.label}
        isDisabled
        className={className}
        testId={testId}
      >
        <span aria-hidden>◐</span>
      </Button>
    );
  }

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? 'system';

  return (
    <Button
      variant="ghost"
      size={size}
      aria-label={t.label}
      title={t[theme]}
      className={className}
      testId={testId}
      onClick={() => {
        setTheme(next);
        onValueChange?.(next);
      }}
    >
      <span aria-hidden>{GLYPH[theme]}</span>
      <span className="sr-only">{t[theme]}</span>
    </Button>
  );
}
