'use client';

/**
 * @tier molecules
 *
 * The `trigger` variant's stateful shell: wires `PeoplePickerTrigger` (closed
 * button) to `PeoplePickerPopover` (open search + grouped list + footer),
 * using `usePeoplePickerPopover` for the open/close/keyboard plumbing.
 */
import { useMemo } from 'react';
import { matchesQuery } from './peoplePickerSearch';
import { PeoplePickerPopover } from './PeoplePickerPopover';
import { PeoplePickerTrigger } from './PeoplePickerTrigger';
import { usePeoplePickerPopover } from './usePeoplePickerPopover';
import type { PeoplePickerMessages, PersonOption } from './PeoplePicker.types';

export function TriggerPeoplePicker({
  id,
  listId,
  label,
  people,
  value,
  onValueChange,
  t,
  isInvalid,
  isDisabled,
  employeeRegisterHref,
  totalCount,
}: {
  id: string;
  listId: string;
  label: string;
  people: readonly PersonOption[];
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  t: PeoplePickerMessages;
  isInvalid: boolean;
  isDisabled: boolean;
  employeeRegisterHref: string | undefined;
  totalCount: number;
}) {
  const { rootRef, popoverRef, isOpen, query, position, setQuery, toggle, close, onKeyDown } =
    usePeoplePickerPopover();
  const selected = people.find((person) => person.id === value);

  const matches = useMemo(
    () => people.filter((person) => matchesQuery(person, query)),
    [people, query],
  );

  return (
    <div ref={rootRef}>
      <PeoplePickerTrigger
        id={id}
        listId={listId}
        label={label}
        person={selected}
        placeholder={t.placeholder}
        isOpen={isOpen}
        isInvalid={isInvalid}
        isDisabled={isDisabled}
        onClick={toggle}
      />
      {isOpen && position && (
        <PeoplePickerPopover
          ref={popoverRef}
          listId={listId}
          position={position}
          query={query}
          matches={matches}
          value={value}
          totalCount={totalCount}
          employeeRegisterHref={employeeRegisterHref}
          t={t}
          onQueryChange={setQuery}
          onSelect={(person) => {
            onValueChange(person.id);
            close();
          }}
          onKeyDown={onKeyDown}
        />
      )}
    </div>
  );
}
