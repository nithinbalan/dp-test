/**
 * @tier atoms
 *
 * Section title. No margins — the stack around it owns spacing.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { HeadingProps } from './Heading.types';

const base = 'text-balance';

const sizes = {
  sm: 'text-sm leading-tight font-semibold',
  md: 'text-md leading-tight font-semibold',
  lg: 'text-lg leading-tight font-bold',
  xl: 'text-xl leading-tight font-bold tracking-tight',
  '2xl': 'text-2xl leading-tight font-bold tracking-tight',
} as const;

/**
 * Level -> tag as a lookup rather than `` `h${level}` ``: a template literal
 * built from a value widens to `string`, which is not a JSX element type.
 */
const elements = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const;

/** The size a level gets when the caller does not override it. */
const sizeForLevel = {
  1: '2xl',
  2: 'xl',
  3: 'lg',
  4: 'md',
  5: 'sm',
  6: 'sm',
} as const;

const tones = {
  neutral: 'text-fg-default',
  muted: 'text-fg-muted',
  brand: 'text-brand-fg',
  accent: 'text-accent-fg',
  danger: 'text-danger-fg',
  inverse: 'text-fg-inverse',
} as const;

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, size, tone = 'neutral', className, testId, children, ...rest },
  ref,
) {
  const Component = elements[level];

  return (
    <Component
      {...rest}
      ref={ref}
      data-testid={testId}
      className={cn(base, sizes[size ?? sizeForLevel[level]], tones[tone], className)}
    >
      {children}
    </Component>
  );
});
