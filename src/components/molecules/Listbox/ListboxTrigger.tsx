/**
 * @tier molecules
 *
 * The closed state: a button styled like `Select`'s wrapper, showing the
 * current label with a chevron.
 */
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';

const sizes = {
  sm: 'h-8 gap-1.5 ps-2.5 pe-8 text-xs',
  md: 'h-9 gap-2 ps-3 pe-9 text-sm',
  lg: 'h-11 gap-2 ps-4 pe-10 text-md',
} as const;

function ListboxTriggerLabel({
  optionLabel,
  placeholder,
  size,
}: {
  optionLabel: string | undefined;
  placeholder: string | undefined;
  size: 'sm' | 'md' | 'lg';
}) {
  const textSize = size === 'lg' ? 'md' : size;
  return (
    <Text
      size={textSize}
      tone={optionLabel !== undefined ? undefined : 'muted'}
      isTruncated
      className="min-w-0 flex-1 text-start"
    >
      {optionLabel ?? placeholder}
    </Text>
  );
}

export function ListboxTrigger({
  id,
  listId,
  label,
  optionLabel,
  placeholder,
  size,
  startSlot,
  isOpen,
  isInvalid,
  isRequired,
  isDisabled,
  className,
  testId,
  onClick,
}: {
  id: string;
  listId: string;
  label: string;
  optionLabel: string | undefined;
  placeholder: string | undefined;
  size: 'sm' | 'md' | 'lg';
  startSlot: ReactNode | undefined;
  isOpen: boolean;
  isInvalid: boolean;
  isRequired: boolean;
  isDisabled: boolean;
  className: string | undefined;
  testId: string | undefined;
  onClick: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="combobox"
      aria-label={label}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-controls={listId}
      aria-invalid={isInvalid || undefined}
      aria-required={isRequired || undefined}
      disabled={isDisabled}
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'border-border-default bg-bg-surface text-fg-default rounded-control relative flex w-full',
        'duration-fast ease-standard items-center border transition-colors',
        'focus-visible:ring-border-focus focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-bg-canvas disabled:cursor-not-allowed disabled:opacity-50',
        isInvalid && 'border-danger-solid focus-visible:ring-danger-solid',
        sizes[size],
        className,
      )}
    >
      {startSlot !== undefined && (
        <span aria-hidden className="text-fg-subtle grid shrink-0 place-items-center">
          {startSlot}
        </span>
      )}
      <ListboxTriggerLabel optionLabel={optionLabel} placeholder={placeholder} size={size} />
      {/* `end-3` resolves against `dir`, so the chevron moves to the left in Arabic. */}
      <span
        aria-hidden
        className="text-fg-subtle pointer-events-none absolute end-3 grid place-items-center"
      >
        <ChevronDown className="size-3.5" />
      </span>
    </button>
  );
}
