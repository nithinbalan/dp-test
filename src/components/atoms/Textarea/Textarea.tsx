/**
 * @tier atoms
 *
 * Multi-line text entry. No margins (parents own spacing).
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { TextareaProps } from './Textarea.types';

const base =
  'block rounded-control border bg-bg-surface text-fg-default ' +
  'placeholder:text-fg-subtle leading-normal ' +
  'transition-colors duration-fast ease-standard outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg-canvas ' +
  'disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-default';

const sizes = {
  sm: 'px-2.5 py-2 text-xs',
  md: 'px-3 py-2.5 text-sm',
  lg: 'px-4 py-3 text-md',
} as const;

const borders = {
  default: 'border-border-default focus-visible:border-border-focus',
  invalid: 'border-danger-solid focus-visible:ring-danger-solid',
} as const;

/** Split out so the render body stays a render rather than a lookup table. */
function textareaClasses({
  size = 'md',
  isInvalid = false,
  isResizable = true,
  fullWidth = false,
  className,
}: Pick<TextareaProps, 'size' | 'isInvalid' | 'isResizable' | 'fullWidth' | 'className'>) {
  return cn(
    base,
    sizes[size],
    isInvalid ? borders.invalid : borders.default,
    // Vertical only: horizontal resize lets the user drag the control past the
    // edge of the form, which reads as a layout bug and cannot be undone.
    isResizable ? 'resize-y' : 'resize-none',
    fullWidth && 'w-full',
    className,
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    size,
    isInvalid = false,
    isResizable,
    fullWidth,
    className,
    rows = 3,
    isRequired = false,
    isReadOnly = false,
    isDisabled = false,
    testId,
    ...rest
  },
  ref,
) {
  return (
    <textarea
      {...rest}
      ref={ref}
      rows={rows}
      disabled={isDisabled}
      required={isRequired}
      readOnly={isReadOnly}
      aria-invalid={isInvalid || undefined}
      data-testid={testId}
      className={textareaClasses({ size, isInvalid, isResizable, fullWidth, className })}
    />
  );
});
