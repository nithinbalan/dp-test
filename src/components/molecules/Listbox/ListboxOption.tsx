/**
 * @tier molecules
 *
 * One row in the popup's option list, with a checkmark slot reserved (not
 * removed) for the rest so every row stays aligned.
 */
import { Check } from 'lucide-react';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { ListboxOption as ListboxOptionType } from './Listbox.types';

export function ListboxOption({
  option,
  isSelected,
  onSelect,
}: {
  option: ListboxOptionType;
  isSelected: boolean;
  onSelect: (option: ListboxOptionType) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      disabled={option.isDisabled}
      onClick={() => {
        onSelect(option);
      }}
      className={cn(
        'hover:bg-bg-subtle rounded-control flex w-full items-center gap-2.5 p-2 text-start',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isSelected && 'bg-brand-subtle',
      )}
    >
      <span className="min-w-0 flex-1">
        <Text size="sm" weight={isSelected ? 'semibold' : 'regular'} isTruncated>
          {option.label}
        </Text>
      </span>
      <span
        aria-hidden
        className={cn(
          'grid shrink-0 place-items-center',
          isSelected ? 'text-brand-solid opacity-100' : 'opacity-0',
        )}
      >
        <Check className="size-4" />
      </span>
    </button>
  );
}
