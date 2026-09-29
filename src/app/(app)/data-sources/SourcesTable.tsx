'use client';

/**
 * The register as a real table — the same sources as the tree view, flattened so
 * they can be compared column by column.
 *
 * Discovered children are shown as a count on the parent rather than as rows of
 * their own: this view exists to scan down one column, and interleaving two
 * levels of hierarchy into a flat table is what makes that impossible.
 */
import { Plug } from 'lucide-react';
import { Button } from '@atoms/Button';
import { IconButton } from '@atoms/IconButton';
import { Table } from '@molecules/Table';
import type { ConnectorCategory } from '@shared/mock/connectors';
import type { DataSource } from '@shared/mock/data-sources';
import type { DataSourcesMessages } from './DataSourcesMessages';
import { formatMessage } from './format-message';
import { SourceDetailLink } from './SourceDetailLink';
import {
  ConnectionBadge,
  LastScanCell,
  PiiCell,
  ScanIcon,
  SourceLogo,
  SourceName,
} from './SourceRowParts';
import type { ScanRuns } from './use-source-scans';

function typeLabel(type: ConnectorCategory, t: DataSourcesMessages): string {
  const labels: Record<ConnectorCategory, string> = {
    app: t.typeLabelApp,
    db: t.typeLabelDb,
    cloud: t.typeLabelCloud,
    file: t.typeLabelFile,
  };
  return labels[type];
}

function RowActions({
  source,
  t,
  isRunning,
  onScan,
  onConnect,
}: {
  source: DataSource;
  t: DataSourcesMessages;
  isRunning: boolean;
  onScan: (source: DataSource) => void;
  onConnect: (source: DataSource) => void;
}) {
  if (source.status === 'off') {
    return (
      <Button
        variant="outline"
        size="sm"
        isLoading={isRunning}
        startSlot={<Plug className="size-4" />}
        onClick={() => {
          onConnect(source);
        }}
        className="whitespace-nowrap"
      >
        {isRunning ? t.connectingLabel : t.connectCta}
      </Button>
    );
  }
  /* .ar-actions: flex gap-8px */
  return (
    <div className="flex items-center justify-end gap-2">
      {/* .ar-ico: 34x34, 9px radius, 1.5px border, hover: green */}
      <IconButton
        label={t.scanNowLabel}
        variant="outline"
        size="sm"
        isDisabled={isRunning}
        onClick={() => {
          onScan(source);
        }}
        className="rounded-control hover:border-brand-fg hover:bg-brand-subtle hover:text-brand-fg size-9"
      >
        <ScanIcon />
      </IconButton>
      <SourceDetailLink
        sourceId={source.id}
        label={t.viewDetailsLabel}
        variant="outline"
        className="rounded-control hover:border-brand-fg hover:bg-brand-subtle hover:text-brand-fg size-9"
      />
    </div>
  );
}

function SourceTableRow({
  source,
  t,
  run,
  onScan,
  onConnect,
}: {
  source: DataSource;
  t: DataSourcesMessages;
  run: ScanRuns[string];
  onScan: (source: DataSource) => void;
  onConnect: (source: DataSource) => void;
}) {
  const discovered = source.children?.length ?? 0;
  const subline =
    discovered > 0
      ? `${source.description} · ${formatMessage(t.discoveredCount, { count: discovered })}`
      : undefined;

  return (
    <Table.Row isDisabled={source.status === 'off'}>
      <Table.Cell>
        {/* .st-src: flex gap-11px, logo 36x36 9px radius */}
        <div className="flex items-center gap-3">
          <SourceLogo source={source} size="xs" />
          <SourceName source={source} subline={subline} />
        </div>
      </Table.Cell>
      <Table.Cell isNowrap>
        {/*
         * .st-type: mono, 10px, bg:cream, border:1px var(--line),
         * border-radius:6px, px:9px py:3px, ink-soft color
         */}
        <span className="text-2xs bg-bg-canvas border-border-default text-fg-subtle rounded-sm border px-2.5 py-0.5 font-mono tracking-wider whitespace-nowrap uppercase">
          {typeLabel(source.type, t)}
        </span>
      </Table.Cell>
      <Table.Cell isNowrap>
        <ConnectionBadge source={source} t={t} />
      </Table.Cell>
      <Table.Cell>
        <PiiCell source={source} t={t} isScanning={run !== undefined} />
      </Table.Cell>
      <Table.Cell>
        <LastScanCell source={source} t={t} run={run} />
      </Table.Cell>
      <Table.Cell align="end">
        <RowActions
          source={source}
          t={t}
          isRunning={run !== undefined}
          onScan={onScan}
          onConnect={onConnect}
        />
      </Table.Cell>
    </Table.Row>
  );
}

export function SourcesTable({
  sources,
  t,
  runs,
  onScan,
  onConnect,
}: {
  sources: readonly DataSource[];
  t: DataSourcesMessages;
  runs: ScanRuns;
  onScan: (source: DataSource) => void;
  onConnect: (source: DataSource) => void;
}) {
  return (
    <div className="rounded-surface border-border-default bg-bg-surface overflow-hidden border shadow-sm">
      <Table label={t.tableCaption} isHoverable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell className="w-1/3">{t.tableName}</Table.HeaderCell>
            <Table.HeaderCell className="w-1/8">{t.tableType}</Table.HeaderCell>
            <Table.HeaderCell className="w-1/6">{t.tableStatus}</Table.HeaderCell>
            <Table.HeaderCell className="w-1/4">{t.tablePii}</Table.HeaderCell>
            <Table.HeaderCell className="w-1/8">{t.tableLastScan}</Table.HeaderCell>
            <Table.HeaderCell align="end">{t.tableActions}</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {sources.map((source) => (
            <SourceTableRow
              key={source.id}
              source={source}
              t={t}
              run={runs[source.id]}
              onScan={onScan}
              onConnect={onConnect}
            />
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
