'use client';

/**
 * @tier molecules
 *
 * The `inline` variant: a pill once a person is chosen, a search field with
 * an anchored list otherwise. The original PeoplePicker shape — still used
 * by RoPA, DPIA and risk/action owner fields.
 */
import { useMemo, useState } from 'react';
import { Avatar } from '@atoms/Avatar';
import { Button } from '@atoms/Button';
import { Input } from '@atoms/Input';
import { Text } from '@atoms/Text';
import { matchesQuery } from './peoplePickerSearch';
import type { PeoplePickerMessages, PersonOption } from './PeoplePicker.types';

function SelectedPill({
  person,
  changeLabel,
  isDisabled,
  onChange,
}: {
  person: PersonOption;
  changeLabel: string;
  isDisabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="border-border-default bg-bg-subtle rounded-control flex h-9 items-center justify-between gap-2 border ps-1.5 pe-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <Avatar label={person.name} initials={person.initials} size="xs" tone="brand" />
        <Text size="sm" isTruncated>
          {person.detail !== undefined ? `${person.name} · ${person.detail}` : person.name}
        </Text>
      </div>
      <Button type="button" variant="ghost" size="xs" isDisabled={isDisabled} onClick={onChange}>
        {changeLabel}
      </Button>
    </div>
  );
}

function PickerList({
  id,
  matches,
  noResults,
  onSelect,
}: {
  id: string;
  matches: readonly PersonOption[];
  noResults: string;
  onSelect: (person: PersonOption) => void;
}) {
  return (
    <div
      id={id}
      role="listbox"
      className="border-border-default bg-bg-surface rounded-surface absolute top-full z-10 mt-1 max-h-56 w-full overflow-y-auto border p-1 shadow-lg"
    >
      {matches.length === 0 && (
        <Text size="sm" tone="muted" className="p-2 text-center">
          {noResults}
        </Text>
      )}
      {matches.map((person) => (
        <button
          key={person.id}
          type="button"
          role="option"
          aria-selected={false}
          onClick={() => {
            onSelect(person);
          }}
          className="hover:bg-bg-subtle rounded-control flex w-full items-center gap-2 p-2 text-start"
        >
          {/* The option's own accessible name already comes from the text below —
              an aria-labelled Avatar alongside it would double up the announcement. */}
          <span aria-hidden>
            <Avatar label={person.name} initials={person.initials} size="xs" tone="brand" />
          </span>
          <div className="min-w-0">
            <Text size="sm" isTruncated>
              {person.name}
            </Text>
            {person.detail !== undefined && (
              <Text size="xs" tone="muted" isTruncated>
                {person.detail}
              </Text>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function SearchField({
  id,
  listId,
  query,
  isEditing,
  matches,
  t,
  isInvalid,
  isRequired,
  isDisabled,
  onFocus,
  onBlur,
  onQueryChange,
  onSelect,
}: {
  id: string;
  listId: string;
  query: string;
  isEditing: boolean;
  matches: readonly PersonOption[];
  t: PeoplePickerMessages;
  isInvalid: boolean;
  isRequired: boolean;
  isDisabled: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onQueryChange: (value: string) => void;
  onSelect: (person: PersonOption) => void;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={isEditing}
        aria-controls={listId}
        placeholder={t.placeholder}
        value={query}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
        isInvalid={isInvalid}
        isRequired={isRequired}
        isDisabled={isDisabled}
        fullWidth
      />
      {isEditing && (
        <PickerList id={listId} matches={matches} noResults={t.noResults} onSelect={onSelect} />
      )}
    </div>
  );
}

export function InlinePeoplePicker({
  id,
  listId,
  people,
  value,
  onValueChange,
  t,
  isInvalid,
  isRequired,
  isDisabled,
}: {
  id: string;
  listId: string;
  people: readonly PersonOption[];
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  t: PeoplePickerMessages;
  isInvalid: boolean;
  isRequired: boolean;
  isDisabled: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState('');
  const selected = people.find((person) => person.id === value);

  const matches = useMemo(
    () => people.filter((person) => matchesQuery(person, query)),
    [people, query],
  );

  if (selected && !isEditing) {
    return (
      <SelectedPill
        person={selected}
        changeLabel={t.changeLabel}
        isDisabled={isDisabled}
        onChange={() => {
          setIsEditing(true);
        }}
      />
    );
  }

  return (
    <SearchField
      id={id}
      listId={listId}
      query={query}
      isEditing={isEditing}
      matches={matches}
      t={t}
      isInvalid={isInvalid}
      isRequired={isRequired}
      isDisabled={isDisabled}
      onFocus={() => {
        setIsEditing(true);
      }}
      onBlur={() => {
        // A plain onBlur fires before a list item's onClick registers —
        // the short delay lets that click complete first.
        setTimeout(() => {
          setIsEditing(false);
        }, 150);
      }}
      onQueryChange={setQuery}
      onSelect={(person) => {
        onValueChange(person.id);
        setQuery('');
        setIsEditing(false);
      }}
    />
  );
}
