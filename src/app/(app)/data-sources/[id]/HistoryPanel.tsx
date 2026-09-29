'use client';

/** The scan log. Kept 24 months, because it is the s.8(5) audit evidence. */
import { FileDown } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { IconButton } from '@atoms/IconButton';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { Table } from '@molecules/Table';
import type { ScanRun } from '@shared/mock/source-details';
import type { SourceDetailMessages } from './SourceDetail.types';

function HistoryRow({
  run,
  t,
  onDownloadReport,
}: {
  run: ScanRun;
  t: SourceDetailMessages;
  onDownloadReport: () => void;
}) {
  return (
    <Table.Row>
      <Table.Cell isNowrap>
        <Text as="span" size="sm" weight="medium" className="block">
          {run.when}
        </Text>
        <Text as="span" size="xs" tone="muted" className="block">
          {run.time}
        </Text>
      </Table.Cell>
      <Table.Cell isNowrap>
        <Badge size="xs" variant="outline">
          {run.type}
        </Badge>
      </Table.Cell>
      <Table.Cell align="end" isNowrap>
        <Text as="span" size="xs" isMono tone="muted">
          {run.duration}
        </Text>
      </Table.Cell>
      <Table.Cell isTruncated>
        <Text as="span" size="xs" tone="muted">
          {run.items}
        </Text>
      </Table.Cell>
      <Table.Cell isNowrap>
        <Text as="span" size="xs" tone={run.isDeltaZero ? 'subtle' : 'warning'}>
          {run.delta}
        </Text>
      </Table.Cell>
      <Table.Cell isNowrap>
        <Badge size="xs" tone={run.status === 'complete' ? 'success' : 'warning'}>
          {run.status === 'complete' ? t.runStatusComplete : t.runStatusPartial}
        </Badge>
      </Table.Cell>
      <Table.Cell align="end">
        <IconButton
          label={t.historyReportLabel}
          variant="ghost"
          size="sm"
          onClick={onDownloadReport}
        >
          <FileDown className="size-4" />
        </IconButton>
      </Table.Cell>
    </Table.Row>
  );
}

export function HistoryPanel({
  history,
  t,
  onDownloadReport,
}: {
  history: readonly ScanRun[];
  t: SourceDetailMessages;
  onDownloadReport: () => void;
}) {
  if (history.length === 0) {
    return <EmptyState label={t.historyEmptyTitle} description={t.historyEmptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <Table label={t.historyTab} isHoverable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t.historyWhen}</Table.HeaderCell>
            <Table.HeaderCell>{t.historyType}</Table.HeaderCell>
            <Table.HeaderCell align="end">{t.historyDuration}</Table.HeaderCell>
            <Table.HeaderCell>{t.historyItems}</Table.HeaderCell>
            <Table.HeaderCell>{t.historyDelta}</Table.HeaderCell>
            <Table.HeaderCell>{t.historyStatus}</Table.HeaderCell>
            <Table.HeaderCell align="end" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {history.map((run) => (
            <HistoryRow key={run.id} run={run} t={t} onDownloadReport={onDownloadReport} />
          ))}
        </Table.Body>
      </Table>
      <Text size="xs" tone="subtle">
        {t.historyRetention}
      </Text>
    </div>
  );
}
