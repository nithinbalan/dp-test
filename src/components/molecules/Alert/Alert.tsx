/**
 * @tier molecules
 *
 * Inline status message. Composes IconButton and Text; owns no state beyond what
 * the caller passes.
 */
import { IconButton } from '@atoms/IconButton';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { AlertProps } from './Alert.types';

const variants = {
  soft: {
    info: 'bg-info-subtle text-info-fg',
    success: 'bg-success-subtle text-success-fg',
    warning: 'bg-warning-subtle text-warning-fg',
    danger: 'bg-danger-subtle text-danger-fg',
    brand: 'bg-brand-subtle text-brand-fg',
    neutral: 'bg-bg-subtle text-fg-muted',
  },
  outline: {
    info: 'border border-info-solid text-info-fg',
    success: 'border border-success-solid text-success-fg',
    warning: 'border border-warning-solid text-warning-fg',
    danger: 'border border-danger-solid text-danger-fg',
    brand: 'border border-brand-solid text-brand-fg',
    neutral: 'border border-border-default text-fg-muted',
  },
} as const;

const sizes = {
  sm: 'gap-2.5 p-3 text-xs',
  md: 'gap-3 p-4 text-sm',
} as const;

/**
 * Urgency, from the same prop that picks the colour. `alert` interrupts whatever
 * the screen reader is saying; `status` waits for a pause. A failed save is worth
 * interrupting for; a success note is not.
 */
const LIVE_ROLE = {
  danger: 'alert',
  warning: 'alert',
  info: 'status',
  success: 'status',
  brand: 'status',
  neutral: 'status',
} as const;

export function Alert({
  label,
  description,
  children,
  tone = 'info',
  variant = 'soft',
  size = 'md',
  startSlot,
  endSlot,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
  testId,
}: AlertProps) {
  return (
    <div
      role={LIVE_ROLE[tone]}
      data-testid={testId}
      className={cn(
        'rounded-surface flex items-start',
        variants[variant][tone],
        sizes[size],
        className,
      )}
    >
      {startSlot !== undefined && (
        <span aria-hidden className="mt-0.5 grid shrink-0 place-items-center">
          {startSlot}
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Text as="span" size={size === 'sm' ? 'xs' : 'sm'} weight="semibold">
          {label}
        </Text>
        {description !== undefined && (
          <Text as="span" size={size === 'sm' ? '2xs' : 'xs'} className="opacity-90">
            {description}
          </Text>
        )}
        {children}
      </div>

      {endSlot !== undefined && <span className="shrink-0">{endSlot}</span>}

      {onDismiss !== undefined && (
        <IconButton
          label={dismissLabel}
          size="xs"
          variant="ghost"
          onClick={onDismiss}
          className="shrink-0 text-current"
        >
          <svg viewBox="0 0 16 16" fill="none" className="size-3.5">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </IconButton>
      )}
    </div>
  );
}
