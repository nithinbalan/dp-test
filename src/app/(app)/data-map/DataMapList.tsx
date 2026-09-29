'use client';

/** Owns search/filter/dialog state for the populated Data Map view. */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Map as MapIcon, Plug, Plus, SearchX, UserPlus, Wand2, X } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { SearchInput } from '@molecules/SearchInput';
import { Table } from '@molecules/Table';
import { useToast } from '@shared/hooks';
import {
  hasSensitiveIdentifiers,
  IDENTIFIER_LABELS,
  SENSITIVE_IDENTIFIERS,
  type Dataset,
  type IdentifierType,
} from '@shared/mock/data-map';
import { AddDatasetDialog } from './AddDatasetDialog';
import type { DataMapMessages } from './DataMapMessages';

type DatasetRow = Dataset & { sourceName: string };
type Filter = 'all' | 'unclassified' | 'sensitive';

function matchesFilter(dataset: DatasetRow, filter: Filter): boolean {
  if (filter === 'unclassified')
    return !dataset.isLinkedToRopa || dataset.identifierTypes.length === 0;
  if (filter === 'sensitive') return hasSensitiveIdentifiers(dataset);
  return true;
}

function IdentifierBadges({ types }: { types: readonly IdentifierType[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((type) => {
        const isSensitive = SENSITIVE_IDENTIFIERS.includes(type);
        return (
          <Badge
            key={type}
            size="xs"
            variant={isSensitive ? 'soft' : 'outline'}
            tone={isSensitive ? 'danger' : 'neutral'}
          >
            {IDENTIFIER_LABELS[type]}
          </Badge>
        );
      })}
    </div>
  );
}

function DatasetsTable({ t, rows }: { t: DataMapMessages; rows: readonly DatasetRow[] }) {
  return (
    <Table label={t.tableCaption}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t.tableDataset}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableSource}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableIdentifiers}</Table.HeaderCell>
          <Table.HeaderCell align="end">{t.tableRecords}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableRopa}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((dataset, idx) => {
          const dsCode = `DS-${String(idx + 1).padStart(3, '0')}`;
          return (
            <Table.Row key={dataset.id}>
              <Table.Cell>
                <div className="flex flex-col gap-0.5">
                  <Text as="span" size="xs" weight="semibold" isMono className="truncate">
                    {dataset.name}
                  </Text>
                  <Text as="span" size="2xs" tone="muted" isMono className="truncate">
                    {dsCode} · {t.discoveredByScan}
                  </Text>
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex flex-col gap-0.5">
                  <Text as="span" size="xs" weight="semibold" className="truncate">
                    {dataset.sourceName}
                  </Text>
                  <Text as="span" size="2xs" tone="muted" className="truncate">
                    {t.firstScanJustNow}
                  </Text>
                </div>
              </Table.Cell>
              <Table.Cell>
                <IdentifierBadges types={dataset.identifierTypes} />
              </Table.Cell>
              <Table.Cell align="end">
                <Text as="span" size="xs" weight="medium" isMono className="tabular-nums">
                  {dataset.recordCount > 0 ? dataset.recordCount.toLocaleString() : '—'}
                </Text>
              </Table.Cell>
              <Table.Cell>
                {dataset.isLinkedToRopa ? (
                  <div className="flex flex-col gap-0.5">
                    <Text as="span" size="xs" weight="bold" className="text-success-fg">
                      {t.ropaLinked}
                    </Text>
                    <Text as="span" size="2xs" tone="muted" className="truncate">
                      {t.activityOwner}
                    </Text>
                  </div>
                ) : (
                  <Button
                    size="xs"
                    variant="soft"
                    tone="danger"
                    startSlot={<UserPlus className="size-3.5" />}
                  >
                    {t.assignOwnerCta}
                  </Button>
                )}
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );
}

function FilterChips({
  t,
  filter,
  setFilter,
  totalCount,
  unclassifiedCount,
  sensitiveCount,
}: {
  t: DataMapMessages;
  filter: Filter;
  setFilter: (f: Filter) => void;
  totalCount: number;
  unclassifiedCount: number;
  sensitiveCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t.tableCaption}>
      <Button
        size="sm"
        variant={filter === 'all' ? 'solid' : 'ghost'}
        tone={filter === 'all' ? 'brand' : 'neutral'}
        onClick={() => {
          setFilter('all');
        }}
        className="gap-1.5"
      >
        {t.filterAll}
        <span className="rounded-control bg-bg-surface/20 px-1.5 py-0.5 font-mono text-xs">
          {totalCount}
        </span>
      </Button>
      <Button
        size="sm"
        variant={filter === 'unclassified' ? 'solid' : 'outline'}
        tone={filter === 'unclassified' ? 'warning' : 'neutral'}
        onClick={() => {
          setFilter('unclassified');
        }}
        className="gap-1.5"
      >
        <span className="bg-warning-fg size-2 rounded-full" />
        {t.filterUnclassified}
        <span className="rounded-control bg-warning-subtle text-warning-fg px-1.5 py-0.5 font-mono text-xs">
          {unclassifiedCount}
        </span>
      </Button>
      <Button
        size="sm"
        variant={filter === 'sensitive' ? 'solid' : 'outline'}
        tone={filter === 'sensitive' ? 'danger' : 'neutral'}
        onClick={() => {
          setFilter('sensitive');
        }}
        className="gap-1.5"
      >
        <span className="bg-danger-fg size-2 rounded-full" />
        {t.filterSensitive}
        <span className="rounded-control bg-danger-subtle text-danger-fg px-1.5 py-0.5 font-mono text-xs">
          {sensitiveCount}
        </span>
      </Button>
    </div>
  );
}

function FilterToolbar({
  t,
  query,
  setQuery,
  filter,
  setFilter,
  totalCount,
  unclassifiedCount,
  sensitiveCount,
  onOpenDialog,
}: {
  t: DataMapMessages;
  query: string;
  setQuery: (q: string) => void;
  filter: Filter;
  setFilter: (f: Filter) => void;
  totalCount: number;
  unclassifiedCount: number;
  sensitiveCount: number;
  onOpenDialog: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-72 flex-1 flex-wrap items-center gap-3">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          messages={{ label: t.searchPlaceholder, placeholder: t.searchPlaceholder }}
          className="min-w-64 flex-1"
        />
        <FilterChips
          t={t}
          filter={filter}
          setFilter={setFilter}
          totalCount={totalCount}
          unclassifiedCount={unclassifiedCount}
          sensitiveCount={sensitiveCount}
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        startSlot={<Plus className="size-4" />}
        onClick={onOpenDialog}
      >
        {t.addDatasetCta}
      </Button>
    </div>
  );
}

function DataMapEmptyState({ t, onOpenDialog }: { t: DataMapMessages; onOpenDialog: () => void }) {
  return (
    <EmptyState
      label={t.emptyTitle}
      description={t.emptyDescription}
      startSlot={<MapIcon className="text-brand-fg size-8" />}
      actionSlot={
        <>
          <Link href="/data-sources">
            <Button tone="brand" startSlot={<Plug className="size-4" />}>
              {t.cta}
            </Button>
          </Link>
          <Button variant="outline" onClick={onOpenDialog} startSlot={<Plus className="size-4" />}>
            {t.secondaryCta}
          </Button>
        </>
      }
    >
      <Text size="xs" isMono tone="muted" className="mt-4 tracking-wider uppercase">
        {t.zeroTag}
      </Text>
    </EmptyState>
  );
}

function FooterDisclaimer({ t }: { t: DataMapMessages }) {
  return (
    <div className="border-border-default text-fg-muted flex flex-wrap items-center justify-between gap-3 border-t pt-4 font-mono text-xs tracking-wider uppercase">
      <span className="flex items-center gap-1.5">
        <Wand2 className="text-brand-fg size-3.5" />
        {t.footerPrivacyNote}
      </span>
      <span>{t.footerTag}</span>
    </div>
  );
}

function DataMapPopulatedContent({
  t,
  query,
  setQuery,
  filter,
  setFilter,
  totalCount,
  unclassifiedCount,
  sensitiveCount,
  filteredCount,
  hasFilterOrQuery,
  filtered,
  onOpenDialog,
  onResetFilters,
}: {
  t: DataMapMessages;
  query: string;
  setQuery: (q: string) => void;
  filter: Filter;
  setFilter: (f: Filter) => void;
  totalCount: number;
  unclassifiedCount: number;
  sensitiveCount: number;
  filteredCount: number;
  hasFilterOrQuery: boolean;
  filtered: readonly DatasetRow[];
  onOpenDialog: () => void;
  onResetFilters: () => void;
}) {
  const metaText = t.metaShowing
    .replace('{shown}', String(filteredCount))
    .replace('{total}', String(totalCount));

  return (
    <div className="flex flex-col gap-4">
      <FilterToolbar
        t={t}
        query={query}
        setQuery={setQuery}
        filter={filter}
        setFilter={setFilter}
        totalCount={totalCount}
        unclassifiedCount={unclassifiedCount}
        sensitiveCount={sensitiveCount}
        onOpenDialog={onOpenDialog}
      />

      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        <Text size="xs" tone="muted">
          {metaText}
        </Text>
        {hasFilterOrQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            startSlot={<X className="size-3.5" />}
          >
            {t.clearFilters}
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          variant="ghost"
          label={t.noResultsTitle}
          description={t.noResultsDescription}
          startSlot={<SearchX className="size-6" />}
          actionSlot={
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              {t.clearFilters}
            </Button>
          }
        />
      ) : (
        <DatasetsTable t={t} rows={filtered} />
      )}

      <FooterDisclaimer t={t} />
    </div>
  );
}

function useDatasetFilter(datasets: readonly DatasetRow[]) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const unclassifiedCount = useMemo(
    () => datasets.filter((d) => matchesFilter(d, 'unclassified')).length,
    [datasets],
  );

  const sensitiveCount = useMemo(
    () => datasets.filter((d) => matchesFilter(d, 'sensitive')).length,
    [datasets],
  );

  const filtered = useMemo(
    () =>
      datasets.filter(
        (dataset) =>
          (dataset.name.toLowerCase().includes(query.toLowerCase()) ||
            dataset.sourceName.toLowerCase().includes(query.toLowerCase()) ||
            dataset.identifierTypes.some((idType) =>
              IDENTIFIER_LABELS[idType].toLowerCase().includes(query.toLowerCase()),
            )) &&
          matchesFilter(dataset, filter),
      ),
    [datasets, query, filter],
  );

  const handleResetFilters = () => {
    setQuery('');
    setFilter('all');
  };

  return {
    query,
    setQuery,
    filter,
    setFilter,
    unclassifiedCount,
    sensitiveCount,
    filtered,
    handleResetFilters,
  };
}

function useAddDataset(initialDatasets: readonly DatasetRow[], t: DataMapMessages) {
  const [datasets, setDatasets] = useState<DatasetRow[]>([...initialDatasets]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const toast = useToast();

  const openDialog = () => {
    setIsDialogOpen(true);
  };
  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  const addDataset = (
    name: string,
    location: string,
    identifiers: string[],
    recordCount: number,
  ) => {
    const newRow: DatasetRow = {
      id: `manual-${String(Date.now())}`,
      name,
      sourceId: 'manual',
      sourceName: location,
      identifierTypes: identifiers as IdentifierType[],
      recordCount,
      isLinkedToRopa: false,
    };
    setDatasets((prev) => [newRow, ...prev]);
    closeDialog();
    toast.show({ label: t.toastAdded.replace('{name}', name), tone: 'success' });
  };

  return { datasets, isDialogOpen, openDialog, closeDialog, addDataset };
}

export function DataMapList({
  datasets: initialDatasets,
  pageLabel,
  pageRefTag,
  pageDescription,
  t,
}: {
  datasets: readonly DatasetRow[];
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  t: DataMapMessages;
}) {
  const { datasets, isDialogOpen, openDialog, closeDialog, addDataset } = useAddDataset(
    initialDatasets,
    t,
  );

  const {
    query,
    setQuery,
    filter,
    setFilter,
    unclassifiedCount,
    sensitiveCount,
    filtered,
    handleResetFilters,
  } = useDatasetFilter(datasets);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        label={pageLabel}
        refTag={pageRefTag}
        description={pageDescription}
        actionSlot={
          datasets.length > 0 ? (
            <Button tone="brand" startSlot={<Plus className="size-4" />} onClick={openDialog}>
              {t.addDatasetCta}
            </Button>
          ) : undefined
        }
      />

      {datasets.length === 0 ? (
        <DataMapEmptyState t={t} onOpenDialog={openDialog} />
      ) : (
        <DataMapPopulatedContent
          t={t}
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
          totalCount={datasets.length}
          unclassifiedCount={unclassifiedCount}
          sensitiveCount={sensitiveCount}
          filteredCount={filtered.length}
          hasFilterOrQuery={query !== '' || filter !== 'all'}
          filtered={filtered}
          onOpenDialog={openDialog}
          onResetFilters={handleResetFilters}
        />
      )}

      <AddDatasetDialog t={t} isOpen={isDialogOpen} onClose={closeDialog} onSubmit={addDataset} />
    </div>
  );
}
