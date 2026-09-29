/**
 * @tier atoms
 *
 * Separator. No margins — the stack around it owns spacing.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { DividerProps } from './Divider.types';

const tones = {
  neutral: 'bg-border-default',
  strong: 'bg-border-strong',
  subtle: 'bg-bg-subtle',
} as const;

export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = 'horizontal', tone = 'neutral', children, className, testId, ...rest },
  ref,
) {
  const isVertical = orientation === 'vertical';

  if (children === undefined) {
    return (
      <div
        {...rest}
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        data-testid={testId}
        className={cn(isVertical ? 'h-full w-px' : 'h-px w-full', tones[tone], className)}
      />
    );
  }

  return (
    <div
      {...rest}
      ref={ref}
      // Decorative: the caption inside is the real boundary marker, and announcing
      // "separator" as well would double it up.
      role="presentation"
      data-testid={testId}
      className={cn('flex w-full items-center gap-3', className)}
    >
      <span aria-hidden className={cn('h-px flex-1', tones[tone])} />
      <span className="text-fg-subtle text-2xs font-mono tracking-widest uppercase">
        {children}
      </span>
      <span aria-hidden className={cn('h-px flex-1', tones[tone])} />
    </div>
  );
});
