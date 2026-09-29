/**
 * @tier atoms
 *
 * Radio. Native input, custom paint — see Radio.types.ts for what the browser is
 * doing for us that a `role="radio"` div would have to reimplement.
 */
import { forwardRef } from 'react';
import { cn } from '@shared/lib';
import type { RadioProps } from './Radio.types';

const sizes = {
  sm: { box: 'size-4', dot: 'size-1.5', text: 'text-xs' },
  md: { box: 'size-5', dot: 'size-2', text: 'text-sm' },
} as const;

const tones = {
  brand: 'checked:border-brand-solid',
  accent: 'checked:border-accent-solid',
  danger: 'checked:border-danger-solid',
} as const;

const dotTones = {
  brand: 'bg-brand-solid',
  accent: 'bg-accent-solid',
  danger: 'bg-danger-solid',
} as const;

const box =
  'peer m-0 shrink-0 appearance-none rounded-pill border bg-bg-surface ' +
  'transition-colors duration-fast ease-standard outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg-canvas disabled:cursor-not-allowed';

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    children,
    size = 'md',
    tone = 'brand',
    isInvalid = false,
    isRequired = false,
    isDisabled = false,
    onValueChange,
    onChange,
    className,
    testId,
    ...rest
  },
  ref,
) {
  const scale = sizes[size];

  return (
    <label
      className={cn(
        'inline-flex items-start gap-2',
        isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative grid shrink-0 place-items-center">
        <input
          {...rest}
          ref={ref}
          type="radio"
          disabled={isDisabled}
          required={isRequired}
          aria-invalid={isInvalid || undefined}
          data-testid={testId}
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(event.target.value);
          }}
          className={cn(
            box,
            scale.box,
            tones[tone],
            isInvalid ? 'border-danger-solid' : 'border-border-strong',
          )}
        />
        {/* The ring stays neutral and only the dot fills, so the control does not
            jump in weight the moment it is selected. */}
        <span
          aria-hidden
          className={cn(
            'rounded-pill pointer-events-none absolute opacity-0 peer-checked:opacity-100',
            dotTones[tone],
            scale.dot,
          )}
        />
      </span>
      {children !== undefined && (
        <span className={cn('text-fg-default', scale.text)}>{children}</span>
      )}
    </label>
  );
});
