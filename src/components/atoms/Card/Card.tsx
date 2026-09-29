/**
 * @tier atoms
 *
 * Surface panel. No external margins — the grid or stack placing it owns those.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { CardProps } from './Card.types';

const base = 'rounded-surface transition-colors duration-fast ease-standard';

const variants = {
  outline: 'border border-border-default bg-bg-surface',
  soft: 'bg-bg-subtle',
  ghost: 'bg-transparent',
} as const;

const sizes = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
} as const;

const elevations = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
} as const;

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    as = 'div',
    variant = 'outline',
    size = 'md',
    elevation = 'none',
    isInteractive = false,
    isInvalid = false,
    className,
    testId,
    children,
    ...rest
  },
  ref,
) {
  /*
   * Rendering a UNION of intrinsic tags makes React infer the INTERSECTION of
   * their ref types, which no single element satisfies. Narrowing the tag name
   * (not the ref) keeps the public `as` prop honest while handing React one shape.
   */
  const Component = as as 'div';

  return (
    <Component
      {...rest}
      ref={ref}
      data-testid={testId}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        elevations[elevation],
        // `focus-within` matters as much as `hover`: a keyboard user tabbing into
        // the card's control gets the same "this one" signal a mouse user gets.
        isInteractive &&
          'hover:border-brand-solid focus-within:border-brand-solid cursor-pointer hover:shadow-md',
        isInvalid && 'border-danger-solid bg-danger-subtle',
        className,
      )}
    >
      {children}
    </Component>
  );
});
