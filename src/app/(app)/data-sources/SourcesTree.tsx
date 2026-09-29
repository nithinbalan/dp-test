'use client';

/**
 * The register as a tree: top-level sources, with the sources a cloud account
 * discovered nested under it.
 *
 * A flat list would be simpler and would lose the one thing this view is for —
 * that `s3://db-backups` is not a source someone added, it is something found
 * inside an AWS account, and disconnecting the account takes it with it.
 *
 * Long child lists page in place rather than scrolling: an account with nine
 * buckets should not push every other source off the screen.
 */
import { ChevronDown, ChevronRight, Plug } from 'lucide-react';
import { Button } from '@atoms/Button';
import { IconButton } from '@atoms/IconButton';
import { cn } from '@shared/lib';
import type { DataSource } from '@shared/mock/data-sources';
import type { DataSourcesMessages } from './DataSourcesMessages';
import { formatMessage } from './format-message';
import {
  ConnectionBadge,
  LastScanCell,
  PiiCell,
  ScanIcon,
  SourceLogo,
  SourceName,
} from './SourceRowParts';
import { SourceDetailLink } from './SourceDetailLink';
import type { ScanRuns } from './use-source-scans';

export type TreeRow = { source: DataSource; children: readonly DataSource[] };

type TreeHandlers = {
  onToggle: (id: string) => void;
  onLoadMore: (id: string) => void;
  onShowLess: (id: string) => void;
  onScan: (source: DataSource) => void;
  onConnect: (source: DataSource) => void;
};

function RowActions({
  source,
  t,
  runs,
  isExpandable,
  isExpanded,
  handlers,
}: {
  source: DataSource;
  t: DataSourcesMessages;
  runs: ScanRuns;
  isExpandable: boolean;
  isExpanded: boolean;
  handlers: TreeHandlers;
}) {
  if (source.status === 'off') {
    const isConnecting = runs[source.id] !== undefined;
    return (
      <Button
        variant="outline"
        size="sm"
        isLoading={isConnecting}
        startSlot={<Plug className="size-4" />}
        onClick={() => {
          handlers.onConnect(source);
        }}
        className="justify-self-end whitespace-nowrap"
      >
        {isConnecting ? t.connectingLabel : t.connectCta}
      </Button>
    );
  }

  return (
    /* .ar-actions: flex gap-8px */
    <div className="flex items-center gap-2 justify-self-end whitespace-nowrap">
      {/* .ar-expand: 26x26, no border, bg:cream, 7px radius, icon 15px, rotate 90 when open */}
      {isExpandable ? (
        <IconButton
          label={isExpanded ? t.collapseLabel : t.expandLabel}
          variant="ghost"
          size="sm"
          aria-expanded={isExpanded}
          onClick={() => {
            handlers.onToggle(source.id);
          }}
          className={cn(
            'rounded-control bg-bg-canvas text-fg-subtle size-6.5 transition-transform duration-200',
            isExpanded && 'text-brand-fg rotate-90',
          )}
        >
          <ChevronRight className="size-4 rtl:-scale-x-100" />
        </IconButton>
      ) : null}
      {/* .ar-ico: 34x34, 9px radius, 1.5px border, hover: green border+bg */}
      <IconButton
        label={t.scanNowLabel}
        variant="outline"
        size="sm"
        isDisabled={runs[source.id] !== undefined}
        onClick={() => {
          handlers.onScan(source);
        }}
        className="rounded-control hover:border-brand-fg hover:bg-brand-subtle hover:text-brand-fg size-8.5 border"
      >
        <ScanIcon />
      </IconButton>
      <SourceDetailLink
        sourceId={source.id}
        label={t.viewDetailsLabel}
        variant="outline"
        className="rounded-control hover:border-brand-fg hover:bg-brand-subtle hover:text-brand-fg size-8.5 border"
      />
    </div>
  );
}

function TreeRowItem({
  source,
  t,
  runs,
  isChild,
  isExpandable,
  isExpanded,
  subline,
  handlers,
}: {
  source: DataSource;
  t: DataSourcesMessages;
  runs: ScanRuns;
  isChild: boolean;
  isExpandable: boolean;
  isExpanded: boolean;
  subline?: string | undefined;
  handlers: TreeHandlers;
}) {
  const run = runs[source.id];
  return (
    <div
      data-id={source.id}
      className={cn(
        /*
         * .ar-row: 6-col grid, 44px logo | 1.35fr name | 132px status | 1.75fr pii | 0.95fr scan | auto actions
         * gap:13px, bg:#fff, border:1px solid var(--line), border-radius:13px,
         * padding:13px 16px, transition:box-shadow .15s
         * hover: box-shadow: 0 8px 24px rgba(27,34,28,.08)
         */
        'border-border-default transition-shadow duration-150',
        isChild
          ? [
              // .ar-row.child: ms-44px, relative, bg:#FBFBF7, p:11px 16px
              // grid: 36px | 1.35fr | 132px | 1.75fr | 0.95fr | auto
              // ::before connector: -start-6 -top-3.5, 20px wide, 38px tall, border-s+border-b, border-es-radius:control
              'bg-bg-hover rounded-surface relative ms-11 border',
              'grid grid-cols-1 items-center gap-3 p-3 shadow-xs',
              'hover:shadow-md',
              'before:border-border-default before:absolute before:-start-6 before:-top-3.5 before:h-9.5 before:w-5',
              'before:rounded-es-control before:border-s-2 before:border-b-2 before:content-[""]',
              'lg:grid-cols-[36px_minmax(0,1.35fr)_132px_minmax(0,1.75fr)_minmax(0,0.95fr)_auto]',
            ]
          : [
              // .ar-row: parent row
              'bg-bg-surface rounded-surface border',
              'grid grid-cols-1 items-center gap-3.5 p-3.5 shadow-sm',
              'hover:shadow-md',
              'lg:grid-cols-[44px_minmax(0,1.35fr)_132px_minmax(0,1.75fr)_minmax(0,0.95fr)_auto]',
            ],
        source.status === 'off' && 'opacity-75',
      )}
    >
      <SourceLogo source={source} size={isChild ? 'xs' : 'sm'} />
      <div className="min-w-0">
        <SourceName source={source} subline={subline} />
      </div>
      <div className="justify-self-start">
        <ConnectionBadge source={source} t={t} />
      </div>
      <div className="min-w-0">
        <PiiCell source={source} t={t} isScanning={run !== undefined} />
      </div>
      <div className="min-w-0">
        <LastScanCell source={source} t={t} run={run} />
      </div>
      <RowActions
        source={source}
        t={t}
        runs={runs}
        isExpandable={isExpandable}
        isExpanded={isExpanded}
        handlers={handlers}
      />
    </div>
  );
}

function ChildPager({
  parentId,
  shown,
  total,
  pageSize,
  t,
  handlers,
}: {
  parentId: string;
  shown: number;
  total: number;
  pageSize: number;
  t: DataSourcesMessages;
  handlers: TreeHandlers;
}) {
  const hasMore = total > shown;
  if (!hasMore && total <= pageSize) return null;
  const nextCount = Math.min(pageSize, total - shown);
  return (
    /*
     * .ar-load: ms-44px, flex, gap-8px, brand-fg color, brand-subtle bg,
     * 1.5px dashed border, 11px radius, py-10px px-16px, 12.5px font,
     * font-600, w:calc(100%-44px), justify-center
     */
    <div className="ms-11">
      <button
        type="button"
        onClick={() => {
          if (hasMore) handlers.onLoadMore(parentId);
          else handlers.onShowLess(parentId);
        }}
        className="text-brand-fg border-brand-subtle-hover bg-brand-subtle hover:bg-brand-subtle-hover rounded-control flex w-full cursor-pointer items-center justify-center gap-2 border border-dashed px-4 py-2.5 text-xs font-semibold transition-colors"
      >
        {hasMore ? (
          <>
            <ChevronDown className="size-3.5" />
            <span>{formatMessage(t.loadMore, { count: nextCount })}</span>
          </>
        ) : (
          <>
            <ChevronDown className="size-3.5 rotate-180" />
            <span>{t.showLess}</span>
          </>
        )}
        <span className="text-fg-muted font-normal">
          · {formatMessage(t.showingCount, { shown: Math.min(shown, total), total })}
        </span>
      </button>
    </div>
  );
}

export function SourcesTree({
  rows,
  t,
  runs,
  expandedIds,
  shownCounts,
  pageSize,
  handlers,
}: {
  rows: readonly TreeRow[];
  t: DataSourcesMessages;
  runs: ScanRuns;
  expandedIds: ReadonlySet<string>;
  shownCounts: Readonly<Record<string, number | undefined>>;
  pageSize: number;
  handlers: TreeHandlers;
}) {
  return (
    <div aria-label={t.registerLabel} className="flex flex-col gap-2.5">
      {rows.map(({ source, children }) => {
        const isExpandable = (source.children?.length ?? 0) > 0;
        const isExpanded = expandedIds.has(source.id);
        const shown = shownCounts[source.id] ?? pageSize;
        const discovered = source.children?.length ?? 0;
        return (
          <TreeGroup
            key={source.id}
            source={source}
            childSources={children}
            t={t}
            runs={runs}
            isExpandable={isExpandable}
            isExpanded={isExpanded}
            shown={shown}
            discovered={discovered}
            pageSize={pageSize}
            handlers={handlers}
          />
        );
      })}
    </div>
  );
}

function TreeGroup({
  source,
  childSources,
  t,
  runs,
  isExpandable,
  isExpanded,
  shown,
  discovered,
  pageSize,
  handlers,
}: {
  source: DataSource;
  childSources: readonly DataSource[];
  t: DataSourcesMessages;
  runs: ScanRuns;
  isExpandable: boolean;
  isExpanded: boolean;
  shown: number;
  discovered: number;
  pageSize: number;
  handlers: TreeHandlers;
}) {
  const subline = isExpandable
    ? `${source.description} · ${formatMessage(t.discoveredCount, { count: discovered })}`
    : undefined;

  return (
    <>
      <TreeRowItem
        source={source}
        t={t}
        runs={runs}
        isChild={false}
        isExpandable={isExpandable}
        isExpanded={isExpanded}
        subline={subline}
        handlers={handlers}
      />
      {isExpanded
        ? childSources
            .slice(0, shown)
            .map((child) => (
              <TreeRowItem
                key={child.id}
                source={child}
                t={t}
                runs={runs}
                isChild
                isExpandable={false}
                isExpanded={false}
                handlers={handlers}
              />
            ))
        : null}
      {isExpanded ? (
        <ChildPager
          parentId={source.id}
          shown={shown}
          total={childSources.length}
          pageSize={pageSize}
          t={t}
          handlers={handlers}
        />
      ) : null}
    </>
  );
}
