/**
 * @tier molecules
 *
 * Search field. Composes Input and IconButton; owns no query state of its own —
 * the list being filtered does.
 */
import { IconButton } from '@atoms/IconButton';
import { Input } from '@atoms/Input';
import { cn } from '@shared/lib';
import type { SearchInputMessages, SearchInputProps } from './SearchInput.types';

const DEFAULT_MESSAGES: SearchInputMessages = {
  label: 'Search',
  placeholder: 'Search',
  clear: 'Clear search',
};

const iconSizes = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
} as const;

export function SearchInput({
  value,
  onValueChange,
  messages,
  size = 'md',
  fullWidth = false,
  isDisabled = false,
  onClear,
  className,
  testId,
}: SearchInputProps) {
  const t = { ...DEFAULT_MESSAGES, ...messages };

  return (
    <Input
      type="search"
      // The name comes from `aria-label`, not the placeholder: a placeholder
      // disappears the moment the user types, taking the label with it.
      aria-label={t.label}
      placeholder={t.placeholder}
      value={value}
      onChange={(event) => {
        onValueChange(event.target.value);
      }}
      size={size}
      fullWidth={fullWidth}
      isDisabled={isDisabled}
      testId={testId}
      className={className}
      startSlot={
        <svg viewBox="0 0 16 16" fill="none" className={cn(iconSizes[size])}>
          <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10.5 10.5L14 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      }
      endSlot={
        // Rendered only when there is something to clear — a permanently visible
        // clear button in an empty field is a control that does nothing.
        value === '' ? undefined : (
          <IconButton
            label={t.clear}
            size="xs"
            variant="ghost"
            isDisabled={isDisabled}
            onClick={() => {
              onValueChange('');
              onClear?.();
            }}
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
        )
      }
    />
  );
}
