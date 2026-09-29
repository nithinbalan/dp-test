'use client';

/**
 * @tier molecules
 *
 * Segmented single-choice control. The radios are visually hidden but really
 * there: the browser then supplies arrow-key movement, one tab stop for the whole
 * group, and set-position announcements — behaviour that a row of `aria-pressed`
 * buttons has to rebuild by hand and usually rebuilds incompletely.
 */
import { useId } from 'react';
import { cn } from '@shared/lib';
import type { SegmentedControlProps } from './SegmentedControl.types';

const sizes = {
  sm: 'h-7 gap-1.5 px-2.5 text-xs',
  md: 'h-8 gap-2 px-3 text-sm',
} as const;

const selectedTones = {
  brand: 'peer-checked:bg-brand-solid peer-checked:text-fg-on-brand',
  accent: 'peer-checked:bg-accent-solid peer-checked:text-fg-on-accent',
  neutral: 'peer-checked:bg-fg-default peer-checked:text-fg-inverse',
  // The three below exist for an ORDERED-SEVERITY control — see
  // SegmentedControlTone's doc comment.
  inverse: 'peer-checked:bg-bg-inverse peer-checked:text-accent-solid',
  muted: 'peer-checked:bg-bg-subtle peer-checked:text-fg-default',
  surface: 'peer-checked:bg-bg-surface peer-checked:text-fg-default peer-checked:shadow-sm',
  // A four-way answer control (Yes/Partly/No/Not sure) is the reference case
  // for these two — "Partly" and "No" need their own colour, not the group's.
  warning: 'peer-checked:bg-warning-solid peer-checked:text-fg-on-warning',
  danger: 'peer-checked:bg-danger-solid peer-checked:text-fg-on-danger',
} as const;

const segmentByVariant = {
  joined:
    'rounded-control text-fg-muted flex cursor-pointer items-center justify-center ' +
    'font-semibold whitespace-nowrap transition-colors duration-fast ease-standard ' +
    'peer-focus-visible:ring-2 peer-focus-visible:ring-border-focus ' +
    'peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-bg-surface ' +
    'peer-enabled:hover:bg-bg-subtle peer-checked:hover:bg-inherit ' +
    'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
  // Each segment is its own bordered button — no shared pill, no border on
  // the selected one (the tone fill reads as "chosen" on its own).
  split:
    'rounded-control border-border-default text-fg-default flex cursor-pointer items-center ' +
    'justify-center gap-1.5 border font-semibold whitespace-nowrap bg-bg-surface ' +
    'transition-colors duration-fast ease-standard ' +
    'peer-enabled:hover:border-brand-solid peer-checked:border-transparent ' +
    'peer-focus-visible:ring-2 peer-focus-visible:ring-border-focus ' +
    'peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-bg-surface ' +
    'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
} as const;

const containerByVariant = {
  joined: 'border-border-default bg-bg-subtle rounded-control inline-flex gap-0.5 border p-0.5',
  split: 'inline-flex flex-wrap gap-1.5',
} as const;

export function SegmentedControl({
  label,
  items,
  value,
  onValueChange,
  name,
  size = 'md',
  variant = 'joined',
  tone = 'brand',
  fullWidth = false,
  isDisabled = false,
  className,
  testId,
}: SegmentedControlProps) {
  const generatedName = useId();
  const groupName = name ?? generatedName;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      data-testid={testId}
      className={cn(containerByVariant[variant], fullWidth && 'flex w-full', className)}
    >
      {items.map((item) => (
        <label key={item.value} className={cn('relative', fullWidth && 'flex-1')}>
          {/*
            `sr-only` rather than `hidden` or `opacity-0`: the input must stay
            focusable and in the accessibility tree — hiding it properly is what
            would break the very behaviour it is here to provide.
          */}
          <input
            type="radio"
            name={groupName}
            value={item.value}
            checked={value === item.value}
            disabled={isDisabled || item.isDisabled === true}
            onChange={() => {
              onValueChange(item.value);
            }}
            className="peer sr-only"
          />
          <span
            className={cn(segmentByVariant[variant], sizes[size], selectedTones[item.tone ?? tone])}
          >
            {item.startSlot !== undefined && (
              <span aria-hidden className="grid shrink-0 place-items-center">
                {item.startSlot}
              </span>
            )}
            {item.label}
          </span>
        </label>
      ))}
    </div>
  );
}
