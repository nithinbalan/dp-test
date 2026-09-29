/**
 * @tier atoms
 *
 * Icon-only action. See IconButton.types.ts for why `label` is required rather
 * than optional-with-a-lint-rule.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { IconButtonProps } from './IconButton.types';

const base =
  'inline-grid shrink-0 place-items-center transition-colors duration-fast ease-standard ' +
  'outline-none focus-visible:ring-2 focus-visible:ring-border-focus ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const sizes = {
  xs: 'size-6 text-xs',
  sm: 'size-8 text-sm',
  md: 'size-9 text-md',
  lg: 'size-11 text-lg',
} as const;

const shapes = {
  rounded: 'rounded-control',
  circle: 'rounded-pill',
} as const;

const variants = {
  solid: {
    neutral: 'bg-fg-default text-fg-inverse hover:bg-fg-muted',
    brand: 'bg-brand-solid text-fg-on-brand hover:bg-brand-solid-hover',
    accent: 'bg-accent-solid text-fg-on-accent hover:bg-accent-solid-hover',
    success: 'bg-success-solid text-fg-on-brand hover:opacity-90',
    warning: 'bg-warning-solid text-fg-on-warning hover:opacity-90',
    danger: 'bg-danger-solid text-fg-on-danger hover:bg-danger-solid-hover',
    info: 'bg-info-solid text-fg-on-brand hover:opacity-90',
  },
  soft: {
    neutral: 'bg-bg-subtle text-fg-muted hover:bg-bg-subtle-hover',
    brand: 'bg-brand-subtle text-brand-fg hover:bg-brand-subtle-hover',
    accent: 'bg-accent-subtle text-accent-fg hover:bg-accent-subtle-hover',
    success: 'bg-success-subtle text-success-fg hover:bg-success-subtle-hover',
    warning: 'bg-warning-subtle text-warning-fg hover:bg-warning-subtle-hover',
    danger: 'bg-danger-subtle text-danger-fg hover:bg-danger-subtle-hover',
    info: 'bg-info-subtle text-info-fg hover:bg-info-subtle-hover',
  },
  outline: {
    neutral: 'border border-border-default text-fg-muted hover:bg-bg-subtle',
    brand: 'border border-brand-solid text-brand-fg hover:bg-brand-subtle',
    accent: 'border border-accent-solid text-accent-fg hover:bg-accent-subtle',
    success: 'border border-success-solid text-success-fg hover:bg-success-subtle',
    warning: 'border border-warning-solid text-warning-fg hover:bg-warning-subtle',
    danger: 'border border-danger-solid text-danger-fg hover:bg-danger-subtle',
    info: 'border border-info-solid text-info-fg hover:bg-info-subtle',
  },
  ghost: {
    neutral: 'text-fg-muted hover:bg-bg-subtle hover:text-fg-default',
    brand: 'text-brand-fg hover:bg-brand-subtle',
    accent: 'text-accent-fg hover:bg-accent-subtle',
    success: 'text-success-fg hover:bg-success-subtle',
    warning: 'text-warning-fg hover:bg-warning-subtle',
    danger: 'text-danger-fg hover:bg-danger-subtle',
    info: 'text-info-fg hover:bg-info-subtle',
  },
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    variant = 'ghost',
    size = 'md',
    shape = 'rounded',
    tone = 'neutral',
    isDisabled = false,
    className,
    testId,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      aria-label={label}
      disabled={isDisabled}
      data-testid={testId}
      className={cn(base, sizes[size], shapes[shape], variants[variant][tone], className)}
    >
      {/* The glyph is decoration — `label` is the name. Reading both duplicates it. */}
      <span aria-hidden className="grid place-items-center">
        {children}
      </span>
    </button>
  );
});
