/**
 * @tier atoms
 *
 * Busy indicator. The spin is wrapped in `motion-safe:` — a continuously rotating
 * element is a genuine trigger for people with vestibular disorders, and
 * `prefers-reduced-motion` is how they say so.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { SpinnerProps } from './Spinner.types';

const sizes = {
  xs: 'size-3 border-2',
  sm: 'size-4 border-2',
  md: 'size-5 border-2',
  lg: 'size-8 border-3',
} as const;

const tones = {
  current: 'text-current',
  brand: 'text-brand-solid',
  accent: 'text-accent-solid',
  muted: 'text-fg-subtle',
  inverse: 'text-fg-inverse',
} as const;

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { label = 'Loading', size = 'md', tone = 'current', className, testId, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      role="status"
      aria-live="polite"
      data-testid={testId}
      className={cn('inline-flex items-center', className)}
    >
      {/* One transparent edge on a full ring is what makes the rotation readable. */}
      <span
        aria-hidden
        className={cn(
          'rounded-pill border-current border-t-transparent motion-safe:animate-spin',
          sizes[size],
          tones[tone],
        )}
      />
      {/*
        TEXT inside the live region, not an `aria-label`: `role="status"` announces
        what appears inside it. A name on an empty region is announced by nothing.
      */}
      <span className="sr-only">{label}</span>
    </span>
  );
});
