/**
 * @tier atoms
 *
 * Filter chip. Selection state lives on `aria-pressed`, so the styling hook and
 * the accessibility contract are the same attribute and cannot disagree.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { ChipProps } from './Chip.types';

const base =
  'inline-flex shrink-0 cursor-pointer items-center rounded-pill font-semibold ' +
  'whitespace-nowrap transition-colors duration-fast ease-standard outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg-canvas ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const sizes = {
  sm: 'h-7 gap-1.5 px-3 text-xs',
  md: 'h-8 gap-2 px-3.5 text-sm',
} as const;

/**
 * Unselected: quiet enough that a bar of twelve chips is not twelve competing
 * marks — except `danger`, which stays legible before selection too (a
 * sensitive-data tag has to read as sensitive whether or not it's picked yet).
 */
const unselected = {
  outline: {
    neutral: 'border border-border-default bg-bg-surface text-fg-muted hover:bg-bg-subtle',
    brand: 'border border-brand-solid bg-bg-surface text-brand-fg hover:bg-brand-subtle',
    accent: 'border border-accent-solid bg-bg-surface text-accent-fg hover:bg-accent-subtle',
    success: 'border border-success-solid bg-bg-surface text-success-fg hover:bg-success-subtle',
    warning: 'border border-warning-solid bg-bg-surface text-warning-fg hover:bg-warning-subtle',
    danger: 'border border-danger-solid bg-bg-surface text-danger-fg hover:bg-danger-subtle',
    info: 'border border-info-solid bg-bg-surface text-info-fg hover:bg-info-subtle',
  },
  ghost: {
    neutral: 'text-fg-muted hover:bg-bg-subtle',
    brand: 'text-brand-fg hover:bg-brand-subtle',
    accent: 'text-accent-fg hover:bg-accent-subtle',
    success: 'text-success-fg hover:bg-success-subtle',
    warning: 'text-warning-fg hover:bg-warning-subtle',
    danger: 'text-danger-fg hover:bg-danger-subtle',
    info: 'text-info-fg hover:bg-info-subtle',
  },
} as const;

/**
 * Selected: filled, because "which filters are on" must be readable at a
 * glance. `neutral` uses `bg-inverse`/`fg-inverse` (fixed, non-theme-flipping
 * tokens) rather than `fg-default`/`fg-inverse` — in dark theme `fg-default`
 * flips to near-white while `fg-inverse` stays white, making a selected
 * neutral chip white-on-white.
 */
const selected = {
  neutral: 'bg-bg-inverse text-fg-inverse hover:bg-bg-inverse-subtle',
  brand: 'bg-brand-solid text-fg-on-brand hover:bg-brand-solid-hover',
  accent: 'bg-accent-solid text-fg-on-accent hover:bg-accent-solid-hover',
  success: 'bg-success-solid text-fg-on-brand',
  warning: 'bg-warning-solid text-fg-on-warning',
  danger: 'bg-danger-solid text-fg-on-danger hover:bg-danger-solid-hover',
  info: 'bg-info-solid text-fg-on-brand',
} as const;

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  {
    variant = 'outline',
    size = 'md',
    tone = 'neutral',
    isSelected = false,
    isDisabled = false,
    onValueChange,
    onClick,
    startSlot,
    endSlot,
    className,
    testId,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      aria-pressed={isSelected}
      disabled={isDisabled}
      data-testid={testId}
      onClick={(event) => {
        onClick?.(event);
        onValueChange?.(!isSelected);
      }}
      className={cn(
        base,
        sizes[size],
        isSelected ? selected[tone] : unselected[variant][tone],
        className,
      )}
    >
      {startSlot}
      {children}
      {endSlot}
    </button>
  );
});
