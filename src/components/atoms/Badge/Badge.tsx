/**
 * @tier atoms
 *
 * Status marker. No margins (a row of badges is the parent's layout problem) and
 * no interactivity — see Badge.types.ts for why that boundary is drawn where it is.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { BadgeProps } from './Badge.types';

/**
 * `whitespace-nowrap` is not cosmetic: badges sit in table cells that shrink, and
 * a wrapped two-line status pill breaks row rhythm across the whole table.
 */
const base =
  'inline-flex shrink-0 items-center rounded-pill font-mono font-medium ' +
  'tracking-wider whitespace-nowrap uppercase';

const sizes = {
  xs: 'h-5 gap-1 px-2 text-2xs',
  sm: 'h-6 gap-1.5 px-2.5 text-2xs',
  md: 'h-7 gap-1.5 px-3 text-xs',
} as const;

const variants = {
  solid: {
    neutral: 'bg-fg-default text-fg-inverse',
    brand: 'bg-brand-solid text-fg-on-brand',
    accent: 'bg-accent-solid text-fg-on-accent',
    success: 'bg-success-solid text-fg-on-brand',
    warning: 'bg-warning-solid text-fg-on-warning',
    danger: 'bg-danger-solid text-fg-on-danger',
    info: 'bg-info-solid text-fg-on-brand',
    inverse: 'bg-bg-inverse text-accent-solid',
  },
  soft: {
    neutral: 'bg-bg-subtle text-fg-muted',
    brand: 'bg-brand-subtle text-brand-fg',
    accent: 'bg-accent-subtle text-accent-fg',
    success: 'bg-success-subtle text-success-fg',
    warning: 'bg-warning-subtle text-warning-fg',
    danger: 'bg-danger-subtle text-danger-fg',
    info: 'bg-info-subtle text-info-fg',
    inverse: 'bg-bg-inverse-subtle text-accent-solid',
  },
  outline: {
    neutral: 'border border-border-default text-fg-muted',
    brand: 'border border-brand-solid text-brand-fg',
    accent: 'border border-accent-solid text-accent-fg',
    success: 'border border-success-solid text-success-fg',
    warning: 'border border-warning-solid text-warning-fg',
    danger: 'border border-danger-solid text-danger-fg',
    info: 'border border-info-solid text-info-fg',
    inverse: 'border border-bg-inverse text-fg-default',
  },
} as const;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = 'soft',
    size = 'sm',
    tone = 'neutral',
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
    <span
      {...rest}
      ref={ref}
      data-testid={testId}
      className={cn(base, sizes[size], variants[variant][tone], className)}
    >
      {startSlot}
      {children}
      {endSlot}
    </span>
  );
});
