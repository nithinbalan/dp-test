/**
 * @tier atoms
 *
 * Anchor. Keeps `rel` and the external-tab warning together with `target`, so the
 * security attribute and the courtesy cannot be added in one place and forgotten
 * in the other.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { LinkProps } from './Link.types';

const base =
  'inline-flex items-center gap-1.5 rounded-xs underline-offset-4 outline-none ' +
  'transition-colors duration-fast ease-standard ' +
  'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg-canvas';

const underlines = {
  always: 'underline',
  hover: 'hover:underline',
  none: 'no-underline',
} as const;

const sizes = {
  '2xs': 'text-2xs',
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-md',
  lg: 'text-lg',
} as const;

const tones = {
  brand: 'text-brand-fg',
  accent: 'text-accent-fg',
  neutral: 'text-fg-default',
  muted: 'text-fg-muted hover:text-fg-default',
  danger: 'text-danger-fg',
} as const;

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    underline = 'hover',
    size,
    tone = 'brand',
    isExternal = false,
    externalLabel = 'opens in a new tab',
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
    <a
      {...rest}
      ref={ref}
      href={href}
      // `noopener` is the security half (the new tab cannot reach back through
      // window.opener); `noreferrer` is the privacy half. Both, always.
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      data-testid={testId}
      className={cn(
        base,
        underlines[underline],
        size !== undefined && sizes[size],
        tones[tone],
        className,
      )}
    >
      {startSlot}
      {children}
      {endSlot}
      {isExternal && <span className="sr-only">{externalLabel}</span>}
    </a>
  );
});
