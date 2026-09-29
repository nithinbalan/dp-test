import type { ComponentPropsWithoutRef } from 'react';

/**
 * Determinate progress along a known range — a completion score, an upload, a
 * remediation burn-down. When the end point is unknown, use Spinner instead:
 * a bar that creeps toward a number it will never reach is worse than no bar.
 *
 * @tier atoms
 * @tag feedback
 * @tag data-display
 */
export type ProgressProps = Omit<ComponentPropsWithoutRef<'div'>, 'className'> & {
  /** Current position. Clamped into `0…max`, so bad data cannot overflow the track. */
  value: number;
  /** Upper bound of the range. @default 100 */
  max?: number | undefined;
  /**
   * What the bar measures, for screen readers. English default; pass a
   * translation. An unnamed progressbar announces only a percentage.
   * @default 'Progress'
   */
  label?: string | undefined;
  /**
   * Human-readable form of the current value, e.g. "18 of 24 records". Read
   * instead of the raw percentage when the percentage is not the point.
   */
  valueLabel?: string | undefined;
  /** Thickness. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Semantic intent of the filled portion. @default 'brand' */
  tone?: 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
