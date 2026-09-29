'use client';

/**
 * @tier molecules
 *
 * Wires a Label, a control, helper text and an error message into one accessible
 * unit. Owns no value — the control the caller renders does.
 */
import { useId } from 'react';
import { Label } from '@atoms/Label';
import { cn } from '@shared/lib';
import type { FieldControl, FieldProps } from './Field.types';

const helpSizes = {
  xs: 'text-2xs',
  sm: 'text-2xs',
  md: 'text-xs',
} as const;

export function Field({
  label,
  children,
  description,
  errorMessage,
  isRequired = false,
  isDisabled = false,
  size = 'sm',
  requiredLabel = 'required',
  endSlot,
  className,
  testId,
}: FieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  // An error message IS the invalid state. Keeping them as separate props lets a
  // caller show red styling with no explanation, or an explanation with no
  // styling — both of which have shipped in every codebase that allowed it.
  const isInvalid = errorMessage !== undefined && errorMessage !== '';

  const describedBy =
    [description !== undefined ? descriptionId : null, isInvalid ? errorId : null]
      .filter((value) => value !== null)
      .join(' ') || undefined;

  const control: FieldControl = {
    id,
    'aria-describedby': describedBy,
    isInvalid,
    isRequired,
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)} data-testid={testId}>
      <Label
        htmlFor={id}
        size={size}
        isRequired={isRequired}
        isDisabled={isDisabled}
        requiredLabel={requiredLabel}
        endSlot={endSlot}
      >
        {label}
      </Label>

      {children(control)}

      {description !== undefined && (
        <p id={descriptionId} className={cn('text-fg-subtle', helpSizes[size])}>
          {description}
        </p>
      )}

      {isInvalid && (
        // `role="alert"` so a validation failure arriving after submit is spoken,
        // rather than sitting silently below a field the user has already left.
        <p id={errorId} role="alert" className={cn('text-danger-fg', helpSizes[size])}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
