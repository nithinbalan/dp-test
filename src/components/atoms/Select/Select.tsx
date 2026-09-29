/**
 * @tier atoms
 *
 * Native select with the design system's chrome. The chevron is ours (the native
 * one cannot be themed); the popup is the platform's (ours would be worse).
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { SelectProps } from './Select.types';

const wrapper =
  'relative inline-flex items-center rounded-control border bg-bg-surface text-fg-default ' +
  'transition-colors duration-fast ease-standard ' +
  'focus-within:ring-2 focus-within:ring-border-focus focus-within:ring-offset-2 ' +
  'focus-within:ring-offset-bg-canvas ' +
  'has-disabled:cursor-not-allowed has-disabled:opacity-50';

const sizes = {
  sm: 'h-8 gap-1.5 ps-2.5 pe-8 text-xs',
  md: 'h-9 gap-2 ps-3 pe-9 text-sm',
  lg: 'h-11 gap-2 ps-4 pe-10 text-md',
} as const;

const borders = {
  default: 'border-border-default focus-within:border-border-focus',
  invalid: 'border-danger-solid focus-within:ring-danger-solid',
} as const;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    options,
    placeholder,
    size = 'md',
    isInvalid = false,
    isRequired = false,
    isDisabled = false,
    fullWidth = false,
    onValueChange,
    onChange,
    startSlot,
    className,
    testId,
    ...rest
  },
  ref,
) {
  return (
    <div
      className={cn(
        wrapper,
        sizes[size],
        isInvalid ? borders.invalid : borders.default,
        fullWidth ? 'flex w-full' : 'inline-flex',
        className,
      )}
    >
      {startSlot !== undefined && (
        <span aria-hidden className="text-fg-subtle grid shrink-0 place-items-center">
          {startSlot}
        </span>
      )}
      <select
        {...rest}
        ref={ref}
        disabled={isDisabled}
        required={isRequired}
        aria-invalid={isInvalid || undefined}
        data-testid={testId}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.target.value);
        }}
        className="min-w-0 flex-1 appearance-none bg-transparent text-inherit outline-none"
      >
        {placeholder !== undefined && (
          // `disabled` keeps it unselectable once the user has moved past it;
          // `value=""` is what makes `required` treat it as "nothing chosen".
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.isDisabled}>
            {option.label}
          </option>
        ))}
      </select>
      {/* `end-3` resolves against `dir`, so the chevron moves to the left in Arabic. */}
      <span
        aria-hidden
        className="text-fg-subtle pointer-events-none absolute end-3 grid place-items-center"
      >
        <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
});
