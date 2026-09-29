'use client';

/** Owns search/filter/pagination state for the Endpoints table. */
import { useMemo, useState } from 'react';
import { Laptop, Send } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Select, type SelectOption } from '@atoms/Select';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { Pagination } from '@molecules/Pagination';
import { SearchInput } from '@molecules/SearchInput';
import { StatCard } from '@molecules/StatCard';
import { useToast } from '@shared/hooks';
import { cn, PAGE_SIZE_OPTIONS } from '@shared/lib';
import { EndpointsTable, type EndpointRow } from './EndpointsTable';
import type { EndpointsMessages } from './EndpointsMessages';

const PAGE_SIZE_SELECT_OPTIONS: SelectOption[] = PAGE_SIZE_OPTIONS.map((size) => ({
  value: String(size),
  label: String(size),
}));

type Filter = 'all' | 'active' | 'pending' | 'findings';

function matchesFilter(row: EndpointRow, filter: Filter): boolean {
  if (filter === 'active') return row.agentStatus === 'active';
  if (filter === 'pending') return row.agentStatus !== 'active';
  if (filter === 'findings') return row.hasPii;
  return true;
}

function matchesEndpoint(row: EndpointRow, query: string, filter: Filter): boolean {
  const matchesQuery =
    row.name.toLowerCase().includes(query.toLowerCase()) ||
    row.deviceId.toLowerCase().includes(query.toLowerCase());
  return matchesQuery && matchesFilter(row, filter);
}

function KpiRow({
  t,
  total,
  activeCount,
  findingsCount,
  pendingCount,
}: {
  t: EndpointsMessages;
  total: number;
  activeCount: number;
  findingsCount: number;
  pendingCount: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label={t.kpiDevices} value={total} />
      <StatCard
        label={t.kpiAgentsActive}
        value={activeCount}
        description={t.kpiAgentsActiveDescription.replace(
          '{percent}',
          String(Math.round((activeCount / total) * 100)),
        )}
        tone="success"
      />
      <StatCard label={t.kpiWithFindings} value={findingsCount} tone="danger" />
      <StatCard label={t.kpiPending} value={pendingCount} tone="warning" />
    </div>
  );
}

function FilterChips({
  t,
  filter,
  onFilterChange,
}: {
  t: EndpointsMessages;
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
}) {
  const chips: { value: Filter; label: string; dotClassName?: string }[] = [
    { value: 'all', label: t.filterAll },
    { value: 'active', label: t.filterActive },
    { value: 'pending', label: t.filterPending, dotClassName: 'bg-warning-solid' },
    { value: 'findings', label: t.filterFindings, dotClassName: 'bg-danger-solid' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t.filterAll}>
      {chips.map((chip) => {
        const isSelected = filter === chip.value;
        return (
          <Button
            key={chip.value}
            size="sm"
            variant={isSelected ? 'solid' : 'ghost'}
            tone="neutral"
            onClick={() => {
              onFilterChange(chip.value);
            }}
            className="gap-1.5"
          >
            {chip.dotClassName !== undefined && (
              <span className={cn('size-1.5 rounded-full', chip.dotClassName)} />
            )}
            {chip.label}
          </Button>
        );
      })}
    </div>
  );
}

function SendLinksButton({
  t,
  pendingCount,
  toast,
}: {
  t: EndpointsMessages;
  pendingCount: number;
  toast: ReturnType<typeof useToast>;
}) {
  return (
    <Button
      tone="brand"
      startSlot={<Send className="size-4" />}
      onClick={() => {
        toast.show({
          label: t.toastBulkInstallSent.replace('{count}', String(pendingCount)),
          tone: 'success',
        });
      }}
    >
      {t.sendLinksCta}
    </Button>
  );
}

function Toolbar({
  t,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  pendingCount,
  toast,
}: {
  t: EndpointsMessages;
  query: string;
  onQueryChange: (value: string) => void;
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
  pendingCount: number;
  toast: ReturnType<typeof useToast>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={query}
        onValueChange={onQueryChange}
        messages={{ label: t.searchPlaceholder, placeholder: t.searchPlaceholder }}
        className="min-w-56 flex-1"
      />
      <FilterChips t={t} filter={filter} onFilterChange={onFilterChange} />
      <SendLinksButton t={t} pendingCount={pendingCount} toast={toast} />
    </div>
  );
}

/** The "10 / 25 / 50 rows per page" control that sits beside the pagination summary. */
function PageSizeSelect({
  t,
  pageSize,
  onPageSizeChange,
}: {
  t: EndpointsMessages;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Text as="span" size="xs" tone="muted">
        {t.pageSizeLabel}
      </Text>
      <Select
        options={PAGE_SIZE_SELECT_OPTIONS}
        value={String(pageSize)}
        onValueChange={(value) => {
          onPageSizeChange(Number(value));
        }}
        size="sm"
        aria-label={t.pageSizeLabel}
        className="w-18"
      />
    </div>
  );
}

function ResultsSection({
  t,
  filtered,
  paged,
  toast,
  page,
  pageCount,
  pageSize,
  rangeFrom,
  rangeTo,
  onPageChange,
  onPageSizeChange,
}: {
  t: EndpointsMessages;
  filtered: readonly EndpointRow[];
  paged: readonly EndpointRow[];
  toast: ReturnType<typeof useToast>;
  page: number;
  pageCount: number;
  pageSize: number;
  rangeFrom: number;
  rangeTo: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  if (filtered.length === 0) {
    return (
      <EmptyState
        label={t.searchPlaceholder}
        variant="ghost"
        startSlot={<Laptop className="size-6" />}
      />
    );
  }

  return (
    <>
      <EndpointsTable t={t} rows={paged} toast={toast} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Text size="xs" tone="muted">
            {t.paginationSummary
              .replace('{from}', String(rangeFrom))
              .replace('{to}', String(rangeTo))
              .replace('{total}', String(filtered.length))}
          </Text>
          <PageSizeSelect t={t} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
        </div>
        <Pagination page={page} pageCount={pageCount} onValueChange={onPageChange} size="sm" />
      </div>
    </>
  );
}

export function EndpointsList({
  endpoints,
  pageLabel,
  pageRefTag,
  pageDescription,
  activeCount,
  findingsCount,
  pendingCount,
  t,
}: {
  endpoints: readonly EndpointRow[];
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  activeCount: number;
  findingsCount: number;
  pendingCount: number;
  t: EndpointsMessages;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const toast = useToast();

  const filtered = useMemo(
    () => endpoints.filter((row) => matchesEndpoint(row, query, filter)),
    [endpoints, query, filter],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const rangeFrom = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, filtered.length);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={pageLabel} refTag={pageRefTag} description={pageDescription} />

      <KpiRow
        t={t}
        total={endpoints.length}
        activeCount={activeCount}
        findingsCount={findingsCount}
        pendingCount={pendingCount}
      />

      <Toolbar
        t={t}
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setPage(1);
        }}
        filter={filter}
        onFilterChange={(next) => {
          setFilter(next);
          setPage(1);
        }}
        pendingCount={pendingCount}
        toast={toast}
      />

      <ResultsSection
        t={t}
        filtered={filtered}
        paged={paged}
        toast={toast}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next);
          setPage(1);
        }}
      />
    </div>
  );
}
