/**
 * @tier atoms
 *
 * Immediate-effect toggle. The thumb is positioned with `justify-*` rather than a
 * translate, so it travels toward the inline-end edge — which is the LEFT in
 * Arabic. A `translate-x` would have moved it the wrong way in RTL, and the bug
 * is invisible to anyone reviewing in English.
 */
import { forwardRef, useId } from 'react';
import { cn } from '@shared/lib';
import type { SwitchProps } from './Switch.types';

const sizes = {
  sm: { track: 'h-5 w-9', thumb: 'size-4', text: 'text-xs' },
  md: { track: 'h-6 w-11', thumb: 'size-5', text: 'text-sm' },
} as const;

const tones = {
  brand: 'bg-brand-solid',
  accent: 'bg-accent-solid',
  success: 'bg-success-solid',
  danger: 'bg-danger-solid',
} as const;

const track =
  'inline-flex shrink-0 items-center rounded-pill p-0.5 ' +
  'transition-colors duration-fast ease-standard outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg-canvas ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    isSelected = false,
    isDisabled = false,
    onValueChange,
    onClick,
    size = 'md',
    tone = 'brand',
    children,
    className,
    testId,
    ...rest
  },
  ref,
) {
  const labelId = useId();
  const scale = sizes[size];

  const control = (
    <button
      {...rest}
      ref={ref}
      type="button"
      role="switch"
      aria-checked={isSelected}
      aria-labelledby={children !== undefined ? labelId : undefined}
      disabled={isDisabled}
      data-testid={testId}
      onClick={(event) => {
        onClick?.(event);
        onValueChange?.(!isSelected);
      }}
      className={cn(
        track,
        scale.track,
        // `justify-end` is direction-aware; the thumb ends up on the correct side
        // in both LTR and RTL without a single branch on locale.
        // The OFF track is `border-strong` rather than `border-default` because
        // `border-default` is neutral-800 in the dark theme, which leaves the thumb
        // (a surface colour, so also near-black there) invisible against it. Both
        // themes map `border-strong` to the same mid grey, so the control reads
        // identically in each — which is right: it is a control, not a surface.
        isSelected ? cn(tones[tone], 'justify-end') : 'bg-border-strong justify-start',
        !children && className,
      )}
    >
      <span aria-hidden className={cn('bg-bg-surface rounded-pill shadow-sm', scale.thumb)} />
    </button>
  );

  if (children === undefined) return control;

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      {control}
      <span id={labelId} className={cn('text-fg-default', scale.text)}>
        {children}
      </span>
    </span>
  );
});
