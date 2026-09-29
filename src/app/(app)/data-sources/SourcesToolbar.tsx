'use client';

/**
 * Search, the two facet filters, the bulk action, and the view switcher.
 *
 * Status and type are separate `Select`s rather than one combined filter because
 * they answer different questions — "what still needs connecting" and "where do
 * my databases sit" — and combining them would multiply into a list nobody reads.
 */
import { Layers, ListTree, Plus, Radar, SlidersHorizontal, Table2 } from 'lucide-react';
import NextLink from 'next/link';
import { Button } from '@atoms/Button';
import { Select, type SelectOption } from '@atoms/Select';
import { SearchInput } from '@molecules/SearchInput';
import { SegmentedControl } from '@molecules/SegmentedControl';
import type { DataSourcesMessages } from './DataSourcesMessages';

export type StatusFilter = 'all' | 'connected' | 'off' | 'pii';
export type TypeFilter = 'all' | 'app' | 'db' | 'cloud' | 'file';
export type RegisterView = 'tree' | 'table';

/** The trailing cluster: bulk scan, add, and the view switcher. */
function ToolbarActions({
  t,
  view,
  onViewChange,
  onScanAll,
}: {
  t: DataSourcesMessages;
  view: RegisterView;
  onViewChange: (value: RegisterView) => void;
  onScanAll: () => void;
}) {
  return (
    <div className="ms-auto flex flex-wrap items-center gap-2">
      <Button variant="outline" startSlot={<Radar className="size-4" />} onClick={onScanAll}>
        {t.scanAllCta}
      </Button>
      <Button asChild tone="brand">
        <NextLink href="/data-sources/add" className="flex items-center gap-1.5">
          <Plus className="size-4" />
          {t.addSourceCta}
        </NextLink>
      </Button>
      <SegmentedControl
        label={t.viewLabel}
        size="md"
        tone="brand"
        items={[
          { value: 'tree', label: t.viewTree, startSlot: <ListTree className="size-4" /> },
          { value: 'table', label: t.viewTable, startSlot: <Table2 className="size-4" /> },
        ]}
        value={view}
        onValueChange={(value) => {
          onViewChange(value as RegisterView);
        }}
      />
    </div>
  );
}

export function SourcesToolbar({
  t,
  query,
  statusFilter,
  typeFilter,
  view,
  onQueryChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onViewChange,
  onScanAll,
}: {
  t: DataSourcesMessages;
  query: string;
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  view: RegisterView;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onTypeFilterChange: (value: TypeFilter) => void;
  onViewChange: (value: RegisterView) => void;
  onScanAll: () => void;
}) {
  const statusOptions: SelectOption[] = [
    { value: 'all', label: t.statusAll },
    { value: 'connected', label: t.statusConnected },
    { value: 'off', label: t.statusOff },
    { value: 'pii', label: t.statusPii },
  ];
  const typeOptions: SelectOption[] = [
    { value: 'all', label: t.typeAll },
    { value: 'app', label: t.typeApp },
    { value: 'db', label: t.typeDb },
    { value: 'cloud', label: t.typeCloud },
    { value: 'file', label: t.typeFile },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <SearchInput
        value={query}
        onValueChange={onQueryChange}
        messages={{ label: t.searchPlaceholder, placeholder: t.searchPlaceholder }}
        className="min-w-56 flex-1"
      />
      <Select
        options={statusOptions}
        value={statusFilter}
        onValueChange={(value) => {
          onStatusFilterChange(value as StatusFilter);
        }}
        startSlot={<SlidersHorizontal className="text-fg-subtle size-4" />}
        aria-label={t.statusFilterLabel}
      />
      <Select
        options={typeOptions}
        value={typeFilter}
        onValueChange={(value) => {
          onTypeFilterChange(value as TypeFilter);
        }}
        startSlot={<Layers className="text-fg-subtle size-4" />}
        aria-label={t.typeFilterLabel}
      />
      <ToolbarActions t={t} view={view} onViewChange={onViewChange} onScanAll={onScanAll} />
    </div>
  );
}
