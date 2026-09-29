/**
 * @tier atoms
 *
 * Body copy. No margins — vertical rhythm belongs to whatever is stacking these.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { TextProps } from './Text.types';

const sizes = {
  '2xs': 'text-2xs',
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
} as const;

const weights = {
  regular: 'font-regular',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
} as const;

const tones = {
  neutral: 'text-fg-default',
  muted: 'text-fg-muted',
  subtle: 'text-fg-subtle',
  brand: 'text-brand-fg',
  accent: 'text-accent-fg',
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  danger: 'text-danger-fg',
  info: 'text-info-fg',
  inverse: 'text-fg-inverse',
} as const;

export const Text = forwardRef<HTMLParagraphElement, TextProps>(function Text(
  {
    as = 'p',
    size = 'md',
    weight = 'regular',
    tone = 'neutral',
    isMono = false,
    isTruncated = false,
    className,
    testId,
    children,
    ...rest
  },
  ref,
) {
  /*
   * Rendering a UNION of intrinsic tags makes React infer the INTERSECTION of
   * their ref types — a ref that is simultaneously an HTMLParagraphElement and an
   * HTMLLIElement, which nothing satisfies. Narrowing the tag name here (rather
   * than widening or casting the ref) keeps the public `as` prop honest while
   * handing React a single element shape.
   */
  const Component = as as 'p';

  return (
    <Component
      {...rest}
      ref={ref}
      data-testid={testId}
      className={cn(
        sizes[size],
        weights[weight],
        tones[tone],
        isMono && 'font-mono',
        isTruncated && 'truncate',
        className,
      )}
    >
      {children}
    </Component>
  );
});
