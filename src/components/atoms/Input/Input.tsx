/**
 * @tier atoms
 *
 * Single-line text entry control. No margins (parents own spacing).
 * Resolves all visual values through semantic tokens only.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { InputProps } from './Input.types';

/**
 * `focus-within` rather than `focus`: the ring belongs to the whole control, and
 * the element that actually takes focus is the `<input>` nested inside it.
 */
const wrapper =
  'inline-flex items-center rounded-control border bg-bg-surface text-fg-default ' +
  'transition-colors duration-fast ease-standard ' +
  'focus-within:ring-2 focus-within:ring-border-focus focus-within:ring-offset-2 ' +
  'focus-within:ring-offset-bg-canvas ' +
  'has-disabled:cursor-not-allowed has-disabled:opacity-50';

const sizes = {
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
  md: 'h-9 gap-2 px-3 text-sm',
  lg: 'h-11 gap-2 px-4 text-md',
} as const;

const borders = {
  default: 'border-border-default focus-within:border-border-focus',
  invalid: 'border-danger-solid focus-within:ring-danger-solid',
} as const;

/** The input carries no chrome of its own — the wrapper owns the box. */
const field =
  'min-w-0 flex-1 bg-transparent text-inherit outline-none placeholder:text-fg-subtle ' +
  'read-only:cursor-default';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    isInvalid = false,
    isRequired = false,
    isReadOnly = false,
    isDisabled = false,
    fullWidth = false,
    startSlot,
    endSlot,
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
      <input
        {...rest}
        ref={ref}
        disabled={isDisabled}
        required={isRequired}
        readOnly={isReadOnly}
        aria-invalid={isInvalid || undefined}
        data-testid={testId}
        className={field}
      />
      {endSlot !== undefined && (
        <span className="text-fg-subtle grid shrink-0 place-items-center">{endSlot}</span>
      )}
    </div>
  );
});
