'use client';

/**
 * @tier molecules
 *
 * A plain <select> on purpose: it is keyboard accessible, screen-reader correct and
 * usable on mobile without any of the focus-management bugs a custom listbox invites.
 * Swap it for a custom control only when there is a requirement a native select
 * cannot meet.
 */
import { cn } from '@shared/lib';
import { LOCALE_CODES, LOCALES, isLocale } from '@shared/types/locale';
import type { LocaleSwitcherProps } from './LocaleSwitcher.types';

const SIZES = {
  sm: 'h-8 ps-2 pe-7 text-sm',
  md: 'h-10 ps-3 pe-8 text-md',
  lg: 'h-12 ps-4 pe-9 text-lg',
} as const;

export function LocaleSwitcher({
  current,
  label,
  onValueChange,
  size = 'md',
  className,
  testId,
}: LocaleSwitcherProps) {
  return (
    <select
      aria-label={label}
      value={current}
      data-testid={testId}
      onChange={(event) => {
        const next = event.target.value;
        if (isLocale(next)) onValueChange?.(next);
      }}
      className={cn(
        'rounded-control border-border-default bg-bg-surface text-fg-default border',
        'focus-visible:ring-border-focus outline-none focus-visible:ring-2',
        SIZES[size],
        className,
      )}
    >
      {LOCALE_CODES.map((code) => (
        // Each language is named in its own script — someone looking for Arabic
        // scans for العربية, not for the word "Arabic".
        <option key={code} value={code} lang={code} dir={LOCALES[code].dir}>
          {LOCALES[code].nativeName}
        </option>
      ))}
    </select>
  );
}
