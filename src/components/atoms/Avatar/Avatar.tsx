/**
 * @tier atoms
 *
 * Identity mark. `role="img"` + `aria-label` is what makes the initials fallback
 * announce as a person rather than as two stray letters mid-sentence.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { AvatarProps } from './Avatar.types';

const base =
  'inline-grid shrink-0 place-items-center overflow-hidden font-mono font-medium select-none';

const sizes = {
  xs: 'size-6 text-2xs',
  sm: 'size-7 text-2xs',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
  xl: 'size-12 text-md',
} as const;

const shapes = {
  rounded: 'rounded-control',
  circle: 'rounded-pill',
  square: 'rounded-none',
} as const;

const tones = {
  neutral: 'bg-bg-subtle text-fg-muted',
  brand: 'bg-brand-subtle text-brand-fg',
  accent: 'bg-accent-subtle text-accent-fg',
  success: 'bg-success-subtle text-success-fg',
  warning: 'bg-warning-subtle text-warning-fg',
  danger: 'bg-danger-subtle text-danger-fg',
  info: 'bg-info-subtle text-info-fg',
} as const;

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  {
    label,
    initials,
    imageSlot,
    size = 'md',
    shape = 'rounded',
    tone = 'brand',
    className,
    testId,
    ...rest
  },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      role="img"
      aria-label={label}
      data-testid={testId}
      className={cn(base, sizes[size], shapes[shape], tones[tone], className)}
    >
      {/* aria-hidden: the label above already names this; the glyphs would be read twice. */}
      {imageSlot ?? (
        <span aria-hidden className="tracking-wide uppercase">
          {initials}
        </span>
      )}
    </span>
  );
});
