'use client';

/**
 * The Data Sources register: the empty-state gate, the KPI row, the filter
 * toolbar, and whichever of the two views is selected.
 *
 * Page-local rather than a design-system organism — the columns, facets and the
 * tree/table split here are specific to this one module (see the "no generic
 * DataTable" note in DESIGN_SYSTEM.md). Sources come from the mock store rather
 * than from props so that a source connected on `/data-sources/add` is already
 * on the register by the time the user arrives back here.
 */
import { useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { Clock, MapPin, Percent, Plus, ShieldCheck, PlugZap } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { StatCard } from '@molecules/StatCard';
import { useToast } from '@shared/hooks';
import {
  connectedCoverage,
  countConnected,
  countDatasets,
  countWithPii,
  type DataSource,
} from '@shared/mock/data-sources';
import type { DataSourcesMessages } from './DataSourcesMessages';
import { formatMessage } from './format-message';
import { SourcesTable } from './SourcesTable';
import {
  SourcesToolbar,
  type RegisterView,
  type StatusFilter,
  type TypeFilter,
} from './SourcesToolbar';
import { SourcesTree, type TreeRow } from './SourcesTree';
import { useDataSources } from './use-data-sources';
import { useSourceScans } from './use-source-scans';

/** How many discovered children a cloud account shows before paging. */
const CHILD_PAGE_SIZE = 4;
/** Cloud accounts open expanded — their children are the interesting part. */
const DEFAULT_EXPANDED = ['src-6'];

function matchesStatus(source: DataSource, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'pii') return source.pii === 'yes' || source.pii === 'risk';
  return source.status === filter;
}

function matchesQuery(source: DataSource, query: string): boolean {
  if (query.length === 0) return true;
  return `${source.name} ${source.description} ${source.connectorId}`.toLowerCase().includes(query);
}

function KpiRow({ t, sources }: { t: DataSourcesMessages; sources: readonly DataSource[] }) {
  return (
    /*
     * .ar-stats: 4-col grid, 14px gap, 22px top margin, 18px bottom margin.
     * Prototype ar-stat card: white bg, 1px border, 13px radius, 16/18px padding.
     * Value: 24px bold, -0.02em tracking. Label: 12px, ink-soft.
     */
    <div className="mt-5.5 mb-4.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      <StatCard label={t.kpiTotalSources} value={sources.length} />
      <StatCard
        label={t.kpiConnected}
        value={countConnected(sources)}
        endSlot={
          <span className="text-brand-fg text-2xs font-mono">
            {formatMessage(t.kpiConnectedDescription, {
              percent: connectedCoverage(sources),
            })}
          </span>
        }
      />
      <StatCard label={t.kpiWithPii} value={countWithPii(sources)} tone="danger" />
      <StatCard label={t.kpiDatasets} value={countDatasets(sources)} />
    </div>
  );
}

function RegisterFooter({ t }: { t: DataSourcesMessages }) {
  /* .ar-foot: flex, space-between, mono, 10.5px, ink-soft, mt-16px, flex-wrap */
  return (
    <div className="text-fg-subtle text-2xs mt-4 flex flex-wrap items-center justify-between gap-2 font-mono tracking-wider">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="text-brand-fg size-3.5" />
        {t.footerNextScan}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="text-brand-fg size-3.5" />
        {t.footerReadOnly}
      </span>
      <span>{t.footerFeeds}</span>
    </div>
  );
}

/**
 * First run: nothing connected yet, so the register would be a table of nothing.
 * Prototype .empty:
 *   white bg, 1.5px dashed border, 16px radius, py-64px px-32px, text-center, mt-24px
 * .empty .ico: 76px circle, green-soft bg, 36px icon
 * .empty .feat span: 12.5px, font-500, cream bg, 1px border, pill, px-14 py-6, flex gap-6
 * .empty .btn: green bg, 14px, font-600, 11px py, 22px px, 10px radius, 1.5px border
 * .empty .soon: mono, 10.5px, ink-soft, mt-18px, block
 */
function RegisterEmptyState({ t }: { t: DataSourcesMessages }) {
  return (
    <div className="bg-bg-surface border-border-default mt-6 rounded-2xl border border-dashed px-8 py-16 text-center">
      {/* .empty .ico */}
      <span
        aria-hidden
        className="bg-brand-subtle mx-auto mb-4.5 grid size-19 place-items-center rounded-full"
      >
        <PlugZap className="text-brand-fg size-9" />
      </span>

      {/* .empty h2 */}
      <h2 className="text-fg-default mb-1.5 text-lg font-bold">{t.emptyTitle}</h2>

      {/* .empty p */}
      <p className="text-fg-subtle mx-auto mb-5.5 max-w-lg text-sm">{t.emptyDescription}</p>

      {/* .empty .feat — badge pills */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2.5">
        <span className="border-border-default bg-bg-canvas text-fg-default inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium">
          <ShieldCheck className="text-brand-fg size-3.5" />
          {t.badgeReadOnly}
        </span>
        <span className="border-border-default bg-bg-canvas text-fg-default inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium">
          <Percent className="text-brand-fg size-3.5" />
          {t.badgeSampled}
        </span>
        <span className="border-border-default bg-bg-canvas text-fg-default inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium">
          <MapPin className="text-brand-fg size-3.5" />
          {t.badgeRegion}
        </span>
      </div>

      {/* .empty .btn — primary CTA */}
      <Button asChild tone="brand" size="lg">
        <NextLink href="/data-sources/add">
          <Plus className="me-2 inline size-4" />
          {t.emptyCta}
        </NextLink>
      </Button>

      {/* .empty .soon */}
      <Text
        as="span"
        size="2xs"
        tone="muted"
        isMono
        className="mt-4.5 block tracking-widest uppercase"
      >
        {t.footerFeeds}
      </Text>
    </div>
  );
}

/** Whether a top-level source survives the current search and both facets. */
function shouldShow({
  source,
  children,
  statusFilter,
  typeFilter,
  needle,
  isTree,
  isRunning,
}: {
  source: DataSource;
  children: readonly DataSource[];
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  needle: string;
  isTree: boolean;
  isRunning: boolean;
}): boolean {
  // Connecting a source flips its status the moment it succeeds, which under a
  // "not connected" filter would take the row off the screen while its first
  // scan is still running. A row with work in flight stays put.
  if (isRunning) return true;
  const matchesFacets =
    matchesStatus(source, statusFilter) && (typeFilter === 'all' || source.type === typeFilter);
  if (!matchesFacets) return false;
  if (matchesQuery(source, needle)) return true;
  // A search that only matches a discovered source still has to show the account
  // it lives in, or the result has no context.
  return isTree && needle.length > 0 && children.length > 0;
}

function useRegisterFilters(
  sources: readonly DataSource[],
  view: RegisterView,
  runningIds: ReadonlySet<string>,
) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const needle = query.trim().toLowerCase();

  const rows = useMemo<readonly TreeRow[]>(
    () =>
      sources.flatMap((source) => {
        // Children are filtered by status and search but never by type: a bucket
        // inside a cloud account is not a separate type the user chose to browse.
        const children = (source.children ?? []).filter(
          (child) => matchesStatus(child, statusFilter) && matchesQuery(child, needle),
        );
        const isVisible = shouldShow({
          source,
          children,
          statusFilter,
          typeFilter,
          needle,
          isTree: view === 'tree',
          isRunning: runningIds.has(source.id),
        });
        return isVisible ? [{ source, children }] : [];
      }),
    [sources, statusFilter, typeFilter, needle, view, runningIds],
  );

  function reset() {
    setQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  }

  return {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    rows,
    reset,
  };
}

/** The register once there is something to register — everything below the KPIs. */
function RegisterBody({
  t,
  rows,
  view,
  runs,
  expandedIds,
  shownCounts,
  handlers,
  onClearFilters,
}: {
  t: DataSourcesMessages;
  rows: readonly TreeRow[];
  view: RegisterView;
  runs: ReturnType<typeof useSourceScans>['runs'];
  expandedIds: ReadonlySet<string>;
  shownCounts: Readonly<Record<string, number | undefined>>;
  handlers: RegisterHandlers;
  onClearFilters: () => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        label={t.noResultsTitle}
        description={t.noResultsDescription}
        variant="ghost"
        actionSlot={
          <Button variant="outline" onClick={onClearFilters}>
            {t.clearFiltersCta}
          </Button>
        }
      />
    );
  }
  if (view === 'tree') {
    return (
      <SourcesTree
        rows={rows}
        t={t}
        runs={runs}
        expandedIds={expandedIds}
        shownCounts={shownCounts}
        pageSize={CHILD_PAGE_SIZE}
        handlers={handlers}
      />
    );
  }
  return (
    <SourcesTable
      sources={rows.map((row) => row.source)}
      t={t}
      runs={runs}
      onScan={handlers.onScan}
      onConnect={handlers.onConnect}
    />
  );
}

type RegisterHandlers = {
  onToggle: (id: string) => void;
  onLoadMore: (id: string) => void;
  onShowLess: (id: string) => void;
  onScan: (source: DataSource) => void;
  onConnect: (source: DataSource) => void;
};

/** Which cloud accounts are expanded, and how many children each is showing. */
function useTreeDisclosure() {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(DEFAULT_EXPANDED),
  );
  const [shownCounts, setShownCounts] = useState<Record<string, number | undefined>>({});

  return {
    expandedIds,
    shownCounts,
    toggle: (id: string) => {
      setExpandedIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    loadMore: (id: string) => {
      setShownCounts((current) => ({
        ...current,
        [id]: (current[id] ?? CHILD_PAGE_SIZE) + CHILD_PAGE_SIZE,
      }));
    },
    showLess: (id: string) => {
      setShownCounts((current) => ({ ...current, [id]: CHILD_PAGE_SIZE }));
    },
  };
}

export function SourceRegister({ messages: t }: { messages: DataSourcesMessages }) {
  const sources = useDataSources();
  const toast = useToast();
  const scans = useSourceScans();
  const { runs, startScan, connect, scanAll } = scans;

  // A source the wizard just added is connected but has never been scanned, so
  // its first scan starts here — the wizard lives on another route and cannot
  // own a run that has to keep going after it unmounts.
  useEffect(() => {
    for (const source of sources) {
      if (source.status === 'connected' && source.pii === 'na' && runs[source.id] === undefined) {
        connect(source);
      }
    }
  }, [sources, runs, connect]);

  const [view, setView] = useState<RegisterView>('tree');
  const disclosure = useTreeDisclosure();
  const runningIds = useMemo(() => new Set(Object.keys(runs)), [runs]);
  const filters = useRegisterFilters(sources, view, runningIds);

  const handlers: RegisterHandlers = {
    onToggle: disclosure.toggle,
    onLoadMore: disclosure.loadMore,
    onShowLess: disclosure.showLess,
    onScan: (source) => {
      startScan(source);
      toast.show({
        label: formatMessage(t.toastScanOneStarted, { name: source.name }),
        tone: 'info',
      });
    },
    onConnect: (source) => {
      connect(source);
      toast.show({
        label: formatMessage(t.toastConnectStarted, { name: source.name }),
        tone: 'info',
      });
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={t.pageLabel} refTag={t.pageRefTag} description={t.pageDescription} />
      {sources.length === 0 ? (
        <RegisterEmptyState t={t} />
      ) : (
        <>
          <KpiRow t={t} sources={sources} />
          <SourcesToolbar
            t={t}
            query={filters.query}
            statusFilter={filters.statusFilter}
            typeFilter={filters.typeFilter}
            view={view}
            onQueryChange={filters.setQuery}
            onStatusFilterChange={filters.setStatusFilter}
            onTypeFilterChange={filters.setTypeFilter}
            onViewChange={setView}
            onScanAll={() => {
              scanAll(sources);
              toast.show({ label: t.toastScanAllStarted, tone: 'info' });
            }}
          />
          <RegisterBody
            t={t}
            rows={filters.rows}
            view={view}
            runs={runs}
            expandedIds={disclosure.expandedIds}
            shownCounts={disclosure.shownCounts}
            handlers={handlers}
            onClearFilters={filters.reset}
          />
          <RegisterFooter t={t} />
        </>
      )}
    </div>
  );
}
