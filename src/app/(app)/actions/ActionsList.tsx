'use client';

/** Owns search/filter/mark-done state for the populated Action Plans register. */
import { useMemo, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { Input } from '@atoms/Input';
import { Select, type SelectOption } from '@atoms/Select';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { StatCard } from '@molecules/StatCard';
import { useToast } from '@shared/hooks';
import { ActionsTable, type ActionRow } from './ActionsTable';
import type { ActionsMessages } from './ActionsMessages';

function FilterRow({
  t,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
}: {
  t: ActionsMessages;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}) {
  const statusOptions: SelectOption[] = [
    { value: 'all', label: t.statusAll },
    { value: 'todo', label: t.statusTodo },
    { value: 'in-progress', label: t.statusInProgress },
    { value: 'done', label: t.statusDone },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={query}
        onChange={(event) => {
          onQueryChange(event.target.value);
        }}
        placeholder={t.searchPlaceholder}
        className="min-w-56"
      />
      <Select
        options={statusOptions}
        value={statusFilter}
        onValueChange={onStatusFilterChange}
        aria-label={t.statusFilterLabel}
      />
    </div>
  );
}

export function ActionsList({
  actions,
  pageLabel,
  pageRefTag,
  pageDescription,
  t,
}: {
  actions: readonly ActionRow[];
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  t: ActionsMessages;
}) {
  const [items, setItems] = useState(actions);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToast();

  const filtered = useMemo(
    () =>
      items.filter(
        (action) =>
          action.title.toLowerCase().includes(query.toLowerCase()) &&
          (statusFilter === 'all' || action.status === statusFilter),
      ),
    [items, query, statusFilter],
  );

  const todoCount = items.filter((action) => action.status === 'todo').length;
  const inProgressCount = items.filter((action) => action.status === 'in-progress').length;
  const doneCount = items.filter((action) => action.status === 'done').length;

  function handleMarkDone(action: ActionRow) {
    setItems((current) =>
      current.map((item) => (item.id === action.id ? { ...item, status: 'done' } : item)),
    );
    toast.show({ label: t.toastMarkedDone.replace('{title}', action.title), tone: 'success' });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={pageLabel} refTag={pageRefTag} description={pageDescription} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.kpiTotal} value={items.length} />
        <StatCard label={t.kpiTodo} value={todoCount} tone="neutral" />
        <StatCard label={t.kpiInProgress} value={inProgressCount} tone="warning" />
        <StatCard label={t.kpiDone} value={doneCount} tone="success" />
      </div>

      <FilterRow
        t={t}
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {filtered.length === 0 ? (
        <EmptyState
          label={t.searchPlaceholder}
          variant="ghost"
          startSlot={<ListChecks className="size-6" />}
        />
      ) : (
        <ActionsTable t={t} rows={filtered} onMarkDone={handleMarkDone} />
      )}
    </div>
  );
}
