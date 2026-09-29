/**
 * @tier atoms
 *
 * Progress bar. The fill is sized with an inline `inlineSize` percentage — the one
 * value that genuinely cannot come from a token, because it is data. Every other
 * value here does.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { ProgressProps } from './Progress.types';

const sizes = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2.5',
} as const;

const tones = {
  brand: 'bg-brand-solid',
  accent: 'bg-accent-solid',
  success: 'bg-success-solid',
  warning: 'bg-warning-solid',
  danger: 'bg-danger-solid',
  info: 'bg-info-solid',
} as const;

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value,
    max = 100,
    label = 'Progress',
    valueLabel,
    size = 'md',
    tone = 'brand',
    className,
    testId,
    ...rest
  },
  ref,
) {
  // Clamped rather than trusted: a value out of range would render a fill wider
  // than its track, which reads as a rendering bug rather than as bad data.
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = (clamped / safeMax) * 100;

  return (
    <div
      {...rest}
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuetext={valueLabel}
      data-testid={testId}
      className={cn('bg-bg-subtle rounded-pill w-full overflow-hidden', sizes[size], className)}
    >
      {/*
        `inlineSize` rather than `width`: in Arabic the bar fills from the right,
        and the logical property is what makes that happen with no locale branch.
      */}
      <div
        className={cn(
          'rounded-pill duration-normal ease-standard h-full transition-all',
          tones[tone],
        )}
        style={{ inlineSize: `${String(percent)}%` }}
      />
    </div>
  );
});
