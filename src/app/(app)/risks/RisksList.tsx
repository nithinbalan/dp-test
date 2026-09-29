'use client';

/** Owns search/filter state for the populated Risk Register. */
import { useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { Input } from '@atoms/Input';
import { Select, type SelectOption } from '@atoms/Select';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { StatCard } from '@molecules/StatCard';
import type { Risk } from '@shared/mock/grc';
import { RisksTable } from './RisksTable';
import type { RisksMessages } from './RisksMessages';

function FilterRow({
  t,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
}: {
  t: RisksMessages;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}) {
  const statusOptions: SelectOption[] = [
    { value: 'all', label: t.statusAll },
    { value: 'open', label: t.statusOpen },
    { value: 'mitigating', label: t.statusMitigating },
    { value: 'closed', label: t.statusClosed },
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

export function RisksList({
  risks,
  pageLabel,
  pageRefTag,
  pageDescription,
  openCount,
  criticalCount,
  closedCount,
  t,
}: {
  risks: readonly Risk[];
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  openCount: number;
  criticalCount: number;
  closedCount: number;
  t: RisksMessages;
}) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(
    () =>
      risks.filter(
        (risk) =>
          risk.title.toLowerCase().includes(query.toLowerCase()) &&
          (statusFilter === 'all' || risk.status === statusFilter),
      ),
    [risks, query, statusFilter],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={pageLabel} refTag={pageRefTag} description={pageDescription} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.kpiTotal} value={risks.length} />
        <StatCard label={t.kpiOpen} value={openCount} tone="danger" />
        <StatCard label={t.kpiCritical} value={criticalCount} tone="warning" />
        <StatCard label={t.kpiClosed} value={closedCount} tone="success" />
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
          startSlot={<Flame className="size-6" />}
        />
      ) : (
        <RisksTable t={t} rows={filtered} />
      )}
    </div>
  );
}
