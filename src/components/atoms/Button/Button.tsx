/**
 * @tier atoms
 *
 * Reference atom. Note what it does NOT do: no margins (parents own spacing),
 * no data fetching, no workspace awareness, no literal colour or px values.
 */
import { forwardRef } from 'react';
import { cn, Slot } from '@shared/lib';
import type { ButtonProps } from './Button.types';

const base =
  'inline-flex shrink-0 items-center justify-center rounded-control font-semibold ' +
  'whitespace-nowrap transition-colors duration-fast ease-standard outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg-canvas ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

/** Box sizes. `link` opts out of them entirely — see {@link linkSizes}. */
const sizes = {
  xs: 'h-7 gap-1.5 px-2.5 text-2xs',
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-9 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
  xl: 'h-12 gap-2.5 px-6 text-md',
} as const;

/**
 * A link-weight button must sit on the text baseline of the sentence around it,
 * so it takes the type scale without the box. Kept as a separate map rather than
 * an override because `cn()` concatenates — it does not resolve Tailwind
 * conflicts, so `h-9 h-auto` would win by stylesheet order, not by intent.
 */
const linkSizes = {
  xs: 'gap-1 text-2xs',
  sm: 'gap-1 text-xs',
  md: 'gap-1.5 text-sm',
  lg: 'gap-1.5 text-sm',
  xl: 'gap-2 text-md',
} as const;

const spinnerSizes = {
  xs: 'size-3',
  sm: 'size-3',
  md: 'size-4',
  lg: 'size-4',
  xl: 'size-5',
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
    neutral: 'bg-bg-subtle text-fg-default hover:bg-bg-subtle-hover',
    brand: 'bg-brand-subtle text-brand-fg hover:bg-brand-subtle-hover',
    accent: 'bg-accent-subtle text-accent-fg hover:bg-accent-subtle-hover',
    success: 'bg-success-subtle text-success-fg hover:bg-success-subtle-hover',
    warning: 'bg-warning-subtle text-warning-fg hover:bg-warning-subtle-hover',
    danger: 'bg-danger-subtle text-danger-fg hover:bg-danger-subtle-hover',
    info: 'bg-info-subtle text-info-fg hover:bg-info-subtle-hover',
  },
  outline: {
    neutral: 'border border-border-default text-fg-default hover:bg-bg-subtle',
    brand: 'border border-brand-solid text-brand-fg hover:bg-brand-subtle',
    accent: 'border border-accent-solid text-accent-fg hover:bg-accent-subtle',
    success: 'border border-success-solid text-success-fg hover:bg-success-subtle',
    warning: 'border border-warning-solid text-warning-fg hover:bg-warning-subtle',
    danger: 'border border-danger-solid text-danger-fg hover:bg-danger-subtle',
    info: 'border border-info-solid text-info-fg hover:bg-info-subtle',
  },
  ghost: {
    neutral: 'text-fg-default hover:bg-bg-subtle',
    brand: 'text-brand-fg hover:bg-brand-subtle',
    accent: 'text-accent-fg hover:bg-accent-subtle',
    success: 'text-success-fg hover:bg-success-subtle',
    warning: 'text-warning-fg hover:bg-warning-subtle',
    danger: 'text-danger-fg hover:bg-danger-subtle',
    info: 'text-info-fg hover:bg-info-subtle',
  },
  link: {
    neutral: 'text-fg-default underline-offset-4 hover:underline',
    brand: 'text-brand-fg underline-offset-4 hover:underline',
    accent: 'text-accent-fg underline-offset-4 hover:underline',
    success: 'text-success-fg underline-offset-4 hover:underline',
    warning: 'text-warning-fg underline-offset-4 hover:underline',
    danger: 'text-danger-fg underline-offset-4 hover:underline',
    info: 'text-info-fg underline-offset-4 hover:underline',
  },
} as const;

/**
 * Resolving appearance is split out so the component body stays a render, not a
 * lookup table. It also keeps every default in one place — a default that lives
 * on the destructure AND in a style map is how the two drift apart.
 */
function buttonClasses({
  variant = 'solid',
  size = 'md',
  tone = 'neutral',
  fullWidth = false,
  className,
}: Pick<ButtonProps, 'variant' | 'size' | 'tone' | 'fullWidth' | 'className'>) {
  return cn(
    base,
    variant === 'link' ? linkSizes[size] : sizes[size],
    variants[variant][tone],
    fullWidth && 'w-full',
    className,
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    tone,
    fullWidth,
    className,
    isLoading = false,
    isDisabled = false,
    startSlot,
    endSlot,
    asChild = false,
    testId,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const classes = buttonClasses({ variant, size, tone, fullWidth, className });

  // asChild renders the caller's own element (a Link, most often) styled as this
  // button, instead of nesting a real <button> inside it. Slots and the loading
  // spinner are a <button>-only concern — the child owns its own content.
  if (asChild) {
    return (
      <Slot
        className={classes}
        data-testid={testId}
        aria-disabled={isDisabled || isLoading || undefined}
        {...rest}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={isDisabled || isLoading}
      aria-busy={isLoading || undefined}
      data-testid={testId}
      className={classes}
    >
      {isLoading ? (
        /* aria-busy on the button is what announces the wait; the ring is decoration. */
        <span
          aria-hidden
          className={cn(
            spinnerSizes[size ?? 'md'],
            'rounded-pill border-2 border-current border-t-transparent motion-safe:animate-spin',
          )}
        />
      ) : (
        startSlot
      )}
      {children}
      {endSlot}
    </button>
  );
});
