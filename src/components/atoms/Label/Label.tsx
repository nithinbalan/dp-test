/**
 * @tier atoms
 *
 * Form caption. No margins — the Field molecule owns the gap to its control.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { LabelProps } from './Label.types';

const base = 'flex items-center gap-2 font-medium text-fg-default';

const sizes = {
  xs: 'text-2xs',
  sm: 'text-xs',
  md: 'text-sm',
} as const;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  {
    htmlFor,
    size = 'sm',
    isRequired = false,
    isDisabled = false,
    requiredLabel = 'required',
    endSlot,
    className,
    testId,
    children,
    ...rest
  },
  ref,
) {
  return (
    <label
      {...rest}
      ref={ref}
      htmlFor={htmlFor}
      data-testid={testId}
      className={cn(base, sizes[size], isDisabled && 'opacity-50', className)}
    >
      {children}
      {isRequired && (
        /*
         * The glyph is decorative; the word beside it is what a screen reader
         * announces. An asterisk on its own is read as "star", or skipped.
         */
        <span className="text-danger-fg">
          <span aria-hidden>*</span>
          <span className="sr-only">{requiredLabel}</span>
        </span>
      )}
      {endSlot !== undefined && <span className="font-regular ms-auto">{endSlot}</span>}
    </label>
  );
});
