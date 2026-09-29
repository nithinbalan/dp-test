/**
 * @tier molecules
 *
 * The `trigger` variant's scrollable option list, grouped by
 * `PersonOption.group`. Ungrouped people render as a single unlabeled group.
 */
import { Text } from '@atoms/Text';
import { PeoplePickerOption } from './PeoplePickerOption';
import type { PersonOption } from './PeoplePicker.types';

const UNGROUPED = Symbol('ungrouped');

function groupPeople(
  people: readonly PersonOption[],
): ReadonlyMap<string | typeof UNGROUPED, PersonOption[]> {
  const groups = new Map<string | typeof UNGROUPED, PersonOption[]>();
  for (const person of people) {
    const key = person.group ?? UNGROUPED;
    const bucket = groups.get(key);
    if (bucket) bucket.push(person);
    else groups.set(key, [person]);
  }
  return groups;
}

export function PeoplePickerGroupedList({
  listId,
  matches,
  value,
  noResults,
  onSelect,
}: {
  listId: string;
  matches: readonly PersonOption[];
  value: string | undefined;
  noResults: string;
  onSelect: (person: PersonOption) => void;
}) {
  const groups = groupPeople(matches);

  return (
    <div role="listbox" id={listId} className="max-h-72 overflow-y-auto p-1">
      {matches.length === 0 && (
        <Text size="sm" tone="muted" className="p-3 text-center">
          {noResults}
        </Text>
      )}
      {[...groups.entries()].map(([group, members]) => (
        <div key={typeof group === 'string' ? group : 'ungrouped'}>
          {typeof group === 'string' && (
            <Text
              size="2xs"
              weight="semibold"
              tone="muted"
              className="px-2 pt-2 pb-1 tracking-wide uppercase"
            >
              {group}
            </Text>
          )}
          {members.map((person) => (
            <PeoplePickerOption
              key={person.id}
              person={person}
              isSelected={person.id === value}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
