'use client';

/**
 * Employees ("People & Awareness") page — s.7(i)/s.8(4). Wired to
 * `/api/employees` via `useEmployees()` (TanStack Query, docs/TANSTACK_QUERY.md,
 * ADR-0006). The roster, its KPIs and every awareness percentage are server
 * state; this component owns only local UI state — search text and pagination.
 * The "Add employee" form lives in `AddEmployeeDialog.tsx`, the table in
 * `EmployeesTable.tsx`, both split out to stay under the per-file line budget.
 */
import { useMemo, useState } from 'react';
import { Bell, Plus, Upload } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Select, type SelectOption } from '@atoms/Select';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { Pagination } from '@molecules/Pagination';
import { PageHeader } from '@molecules/PageHeader';
import { SearchInput } from '@molecules/SearchInput';
import { StatCard } from '@molecules/StatCard';
import { useEmployees, useToast, type EmployeeRow, type EmployeesData } from '@shared/hooks';
import { PAGE_SIZE_OPTIONS } from '@shared/lib';
import { AddEmployeeDialog } from './AddEmployeeDialog';
import { EmployeesTable, EmployeesTableSkeleton } from './EmployeesTable';
import { ImportEmployeesDialog } from './ImportEmployeesDialog';
import type { EmployeesMessages } from './EmployeesMessages';

const PAGE_SIZE_SELECT_OPTIONS: SelectOption[] = PAGE_SIZE_OPTIONS.map((size) => ({
  value: String(size),
  label: String(size),
}));
/** The loading toolbar's search field is disabled — this satisfies its required handler. */
const NOOP = () => {
  /* disabled during loading */
};

/**
 * Same KPI grid, toolbar, table and pagination footer the loaded page renders —
 * just with `isLoading`/`isDisabled` states instead of real values, so nothing
 * shifts position or size once data arrives. A page-shaped skeleton (real
 * labels, real column headers, an avatar-circle-plus-two-lines per row) reads
 * as "this page is loading" far better than two generic grey rectangles.
 */
function EmployeesLoading({ t }: { t: EmployeesMessages }) {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <EmployeesKpis t={t} isLoading />
      <div className="flex flex-wrap items-stretch gap-2">
        <SearchInput
          value=""
          onValueChange={NOOP}
          messages={{ label: t.searchPlaceholder, placeholder: t.searchPlaceholder }}
          className="min-w-52 flex-1"
          isDisabled
        />
        <Button variant="outline" tone="brand" startSlot={<Upload className="size-4" />} isDisabled>
          {t.importCta}
        </Button>
        <Button tone="brand" startSlot={<Bell className="size-4" />} isDisabled>
          {t.remindCta}
        </Button>
      </div>
      <EmployeesTableSkeleton t={t} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

function EmployeesKpis({
  t,
  data,
  isLoading = false,
}: {
  t: EmployeesMessages;
  data?: EmployeesData;
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label={t.kpiEmployees} value={data?.employees.length} isLoading={isLoading} />
      <StatCard
        label={t.kpiWithAgent}
        value={data?.withAgentCount}
        tone="success"
        isLoading={isLoading}
      />
      <StatCard
        label={t.kpiAvgAwareness}
        value={data ? `${String(data.avgAwarenessPercent)}%` : undefined}
        tone="brand"
        isLoading={isLoading}
      />
      <StatCard
        label={t.kpiOverdue}
        value={data?.overdueCount}
        tone="danger"
        isLoading={isLoading}
      />
    </div>
  );
}

function EmployeesToolbar({
  t,
  query,
  onQueryChange,
  onImport,
}: {
  t: EmployeesMessages;
  query: string;
  onQueryChange: (value: string) => void;
  onImport: () => void;
}) {
  const toast = useToast();

  return (
    <div className="flex flex-wrap items-stretch gap-2">
      <SearchInput
        value={query}
        onValueChange={onQueryChange}
        messages={{ label: t.searchPlaceholder, placeholder: t.searchPlaceholder }}
        className="min-w-52 flex-1"
      />
      <Button
        variant="outline"
        tone="brand"
        startSlot={<Upload className="size-4" />}
        onClick={onImport}
      >
        {t.importCta}
      </Button>
      <Button
        tone="brand"
        startSlot={<Bell className="size-4" />}
        onClick={() => {
          toast.show({ label: t.toastAllReminded, tone: 'success' });
        }}
      >
        {t.remindCta}
      </Button>
    </div>
  );
}

/** The "10 / 25 / 50 rows per page" control that sits beside the pagination summary. */
function PageSizeSelect({
  t,
  pageSize,
  onPageSizeChange,
}: {
  t: EmployeesMessages;
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

/** Pagination summary, the page-size select and the page controls, in one row. */
function RosterFooter({
  t,
  page,
  pageCount,
  pageSize,
  rangeFrom,
  rangeTo,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  t: EmployeesMessages;
  page: number;
  pageCount: number;
  pageSize: number;
  rangeFrom: number;
  rangeTo: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Text size="xs" tone="muted">
          {t.paginationSummary
            .replace('{from}', String(rangeFrom))
            .replace('{to}', String(rangeTo))
            .replace('{total}', String(total))}
        </Text>
        <PageSizeSelect t={t} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
      </div>
      <Pagination page={page} pageCount={pageCount} onValueChange={onPageChange} size="sm" />
    </div>
  );
}

// Footer bar — matches prototype .ar-foot
function FooterBar({ t }: { t: EmployeesMessages }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Text as="span" size="2xs" tone="subtle" isMono className="uppercase">
        {t.footerAgentNote}
      </Text>
      <Text as="span" size="2xs" tone="subtle" isMono className="uppercase">
        {t.footerRefNote}
      </Text>
    </div>
  );
}

function EmployeesRoster({
  t,
  data,
  query,
  onClearQuery,
  onAddEmployee,
}: {
  t: EmployeesMessages;
  data: EmployeesData;
  query: string;
  onClearQuery: () => void;
  onAddEmployee: () => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const toast = useToast();

  const filtered = useMemo(
    () =>
      data.employees.filter((e: EmployeeRow) =>
        e.fullName.toLowerCase().includes(query.toLowerCase()),
      ),
    [data.employees, query],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const rangeFrom = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, filtered.length);

  if (data.employees.length === 0) {
    return (
      <EmptyState
        label={t.emptyTitle}
        description={t.emptyDescription}
        actionSlot={
          <Button tone="brand" startSlot={<Plus className="size-4" />} onClick={onAddEmployee}>
            {t.addEmployeeCta}
          </Button>
        }
      />
    );
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        label={t.noMatchTitle}
        description={t.noMatchDescription}
        actionSlot={
          <Button variant="outline" onClick={onClearQuery}>
            {t.clearSearchCta}
          </Button>
        }
      />
    );
  }

  return (
    <>
      <EmployeesTable
        t={t}
        rows={paged}
        onRemind={(name) => {
          toast.show({ label: t.toastReminderSent.replace('{name}', name), tone: 'success' });
        }}
      />
      <RosterFooter
        t={t}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setPageSize(next);
          setPage(1);
        }}
      />
    </>
  );
}

export function EmployeesList({
  pageLabel,
  pageRefTag,
  pageDescription,
  t,
}: {
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  t: EmployeesMessages;
}) {
  const [query, setQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { data, isLoading, isError } = useEmployees();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        label={pageLabel}
        refTag={pageRefTag}
        description={pageDescription}
        actionSlot={
          <Button
            tone="brand"
            startSlot={<Plus className="size-4" />}
            onClick={() => {
              setIsAddOpen(true);
            }}
          >
            {t.addEmployeeCta}
          </Button>
        }
      />

      {isLoading && <EmployeesLoading t={t} />}

      {!isLoading && isError && (
        <EmptyState label={t.loadErrorTitle} description={t.loadErrorDescription} tone="danger" />
      )}

      {!isLoading && !isError && data && (
        <>
          <EmployeesKpis t={t} data={data} />
          <EmployeesToolbar
            t={t}
            query={query}
            onQueryChange={setQuery}
            onImport={() => {
              setIsImportOpen(true);
            }}
          />
          <EmployeesRoster
            key={query}
            t={t}
            data={data}
            query={query}
            onClearQuery={() => {
              setQuery('');
            }}
            onAddEmployee={() => {
              setIsAddOpen(true);
            }}
          />
          <FooterBar t={t} />
        </>
      )}

      <AddEmployeeDialog
        t={t}
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
        }}
      />
      <ImportEmployeesDialog
        t={t}
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
        }}
      />
    </div>
  );
}
