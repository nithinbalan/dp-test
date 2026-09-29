'use client';

/**
 * @tier molecules
 *
 * The `trigger` variant's closed state: a combobox-style button showing the
 * current selection (avatar, name, role · department) with a chevron. Stays
 * mounted whether or not a person is selected — unlike the `inline` variant's
 * pill, this never gets replaced by the search field itself.
 */
import { ChevronsUpDown } from 'lucide-react';
import { Avatar } from '@atoms/Avatar';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import type { PersonOption } from './PeoplePicker.types';

export function PeoplePickerTrigger({
  id,
  listId,
  label,
  person,
  placeholder,
  isOpen,
  isInvalid,
  isDisabled,
  onClick,
}: {
  id: string;
  listId: string;
  label: string;
  person: PersonOption | undefined;
  placeholder: string;
  isOpen: boolean;
  isInvalid: boolean;
  isDisabled: boolean;
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
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        'border-border-default bg-bg-surface rounded-control flex h-11 w-full items-center gap-2.5',
        'duration-fast ease-standard border ps-2 pe-3 text-start transition-colors',
        'focus-visible:ring-border-focus focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-bg-canvas disabled:cursor-not-allowed disabled:opacity-50',
        isInvalid && 'border-danger-solid',
      )}
    >
      {person ? (
        <>
          <span aria-hidden>
            <Avatar label={person.name} initials={person.initials} size="sm" tone="brand" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start">
            <Text size="sm" weight="semibold" isTruncated>
              {person.name}
            </Text>
            {person.detail !== undefined && (
              <Text size="xs" tone="muted" isTruncated>
                {person.detail}
              </Text>
            )}
          </span>
        </>
      ) : (
        <Text size="sm" tone="muted" className="min-w-0 flex-1">
          {placeholder}
        </Text>
      )}
      <span aria-hidden className="text-fg-subtle grid shrink-0 place-items-center">
        <ChevronsUpDown className="size-4" />
      </span>
    </button>
  );
}
