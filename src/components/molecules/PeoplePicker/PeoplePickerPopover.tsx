'use client';

/**
 * @tier molecules
 *
 * The `trigger` variant's open state: search row, `PeoplePickerGroupedList`,
 * and a footer pointing at the full employee register. Portaled to
 * `document.body` and positioned `fixed` from `usePeoplePickerPopover`'s
 * live measurement, so it's never clipped by a scroll-bounded ancestor.
 */
import { forwardRef, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Search, Users } from 'lucide-react';
import { Input } from '@atoms/Input';
import { cn } from '@shared/lib';
import { PeoplePickerGroupedList } from './PeoplePickerGroupedList';
import type { PeoplePickerPopoverPosition } from './usePeoplePickerPopover';
import type { PeoplePickerMessages, PersonOption } from './PeoplePicker.types';

function footerText(template: string, count: number, total: number): string {
  return template.replace('{count}', String(count)).replace('{total}', String(total));
}

function PeoplePickerSearchRow({
  query,
  t,
  onQueryChange,
}: {
  query: string;
  t: PeoplePickerMessages;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="border-border-default border-b p-1.5">
      <Input
        autoFocus
        value={query}
        placeholder={t.searchPlaceholder}
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
        startSlot={<Search className="size-4" />}
        endSlot={
          <span
            aria-hidden
            className="border-border-default text-fg-subtle rounded-control text-2xs border px-1.5 py-0.5"
          >
            {t.escHint}
          </span>
        }
        fullWidth
        aria-label={t.searchPlaceholder}
      />
    </div>
  );
}

function PeoplePickerFooter({
  matchCount,
  totalCount,
  employeeRegisterHref,
  t,
}: {
  matchCount: number;
  totalCount: number;
  employeeRegisterHref: string | undefined;
  t: PeoplePickerMessages;
}) {
  return (
    <div className="border-border-default bg-bg-subtle flex items-center justify-between gap-2 border-t px-2.5 py-2">
      <span className="text-fg-muted flex items-center gap-1.5 text-xs">
        <Users aria-hidden className="size-3.5" />
        {footerText(t.footerLabel, matchCount, totalCount)}
      </span>
      {employeeRegisterHref !== undefined && (
        <a
          href={employeeRegisterHref}
          className="text-brand-fg text-xs font-semibold hover:underline"
        >
          {t.manageLabel}
        </a>
      )}
    </div>
  );
}

export const PeoplePickerPopover = forwardRef<
  HTMLDivElement,
  {
    listId: string;
    position: PeoplePickerPopoverPosition;
    query: string;
    matches: readonly PersonOption[];
    value: string | undefined;
    totalCount: number;
    employeeRegisterHref: string | undefined;
    t: PeoplePickerMessages;
    onQueryChange: (value: string) => void;
    onSelect: (person: PersonOption) => void;
    onKeyDown: (event: KeyboardEvent) => void;
  }
>(function PeoplePickerPopover(
  {
    listId,
    position,
    query,
    matches,
    value,
    totalCount,
    employeeRegisterHref,
    t,
    onQueryChange,
    onSelect,
    onKeyDown,
  },
  ref,
) {
  return createPortal(
    <div
      ref={ref}
      style={{ ...position.style, minWidth: 288 }}
      className={cn(
        'border-border-default bg-bg-surface rounded-surface z-50 overflow-hidden border shadow-lg',
      )}
      onKeyDown={onKeyDown}
    >
      <PeoplePickerSearchRow query={query} t={t} onQueryChange={onQueryChange} />

      <PeoplePickerGroupedList
        listId={listId}
        matches={matches}
        value={value}
        noResults={t.noResults}
        onSelect={onSelect}
      />

      <PeoplePickerFooter
        matchCount={matches.length}
        totalCount={totalCount}
        employeeRegisterHref={employeeRegisterHref}
        t={t}
      />
    </div>,
    document.body,
  );
});
