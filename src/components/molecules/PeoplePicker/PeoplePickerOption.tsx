/**
 * @tier molecules
 *
 * One row in the `trigger` variant's popover list: avatar, name, role, and a
 * checkmark slot that only renders filled for the current selection —
 * reserved (not removed) for the rest so every row stays aligned.
 */
import { Check } from 'lucide-react';
import { Avatar } from '@atoms/Avatar';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { PersonOption } from './PeoplePicker.types';

export function PeoplePickerOption({
  person,
  isSelected,
  onSelect,
}: {
  person: PersonOption;
  isSelected: boolean;
  onSelect: (person: PersonOption) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => {
        onSelect(person);
      }}
      className="hover:bg-bg-subtle rounded-control flex w-full items-center gap-2.5 p-2 text-start"
    >
      <span aria-hidden>
        <Avatar label={person.name} initials={person.initials} size="xs" tone="brand" />
      </span>
      <span className="min-w-0 flex-1">
        <Text size="sm" weight="semibold" isTruncated>
          {person.name}
        </Text>
        {person.detail !== undefined && (
          <Text size="xs" tone="muted" isTruncated>
            {person.detail}
          </Text>
        )}
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
