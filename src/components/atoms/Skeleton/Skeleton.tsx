/**
 * @tier atoms
 *
 * Loading placeholder. Sizing is deliberately the caller's job: only the caller
 * knows the shape of the content this is standing in for, and a skeleton that
 * does not match causes a layout jump when the real content lands.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { SkeletonProps } from './Skeleton.types';

const shapes = {
  rounded: 'rounded-control',
  circle: 'rounded-pill',
  square: 'rounded-none',
} as const;

const sizes = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-6',
} as const;

const block = 'bg-bg-subtle';

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { shape = 'rounded', size, lines = 1, isAnimated = true, className, testId, ...rest },
  ref,
) {
  const blockClass = cn(
    block,
    shapes[shape],
    size !== undefined && sizes[size],
    // `motion-safe:` because a shimmer that never stops is a vestibular trigger.
    isAnimated && 'motion-safe:animate-pulse',
  );

  return (
    <div
      {...rest}
      ref={ref}
      // Hidden from AT: the loading state belongs to the region around this, which
      // should carry `aria-busy`. Announcing the placeholders themselves is noise.
      aria-hidden
      data-testid={testId}
      className={cn(lines > 1 && 'flex flex-col gap-2', className)}
    >
      {lines > 1 ? (
        Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={cn(
              blockClass,
              size === undefined && 'h-4',
              // A ragged last line is what makes a block read as a paragraph
              // rather than as a table.
              index === lines - 1 && 'w-3/5',
            )}
          />
        ))
      ) : (
        <div className={cn(blockClass, 'size-full')} />
      )}
    </div>
  );
});
