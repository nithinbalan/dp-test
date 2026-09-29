import type { PersonOption } from './PeoplePicker.types';

/** Shared filter predicate for both variants: matches name, detail or group. */
export function matchesQuery(person: PersonOption, query: string): boolean {
  const needle = query.toLowerCase();
  return (
    person.name.toLowerCase().includes(needle) ||
    (person.detail?.toLowerCase().includes(needle) ?? false) ||
    (person.group?.toLowerCase().includes(needle) ?? false)
  );
}
