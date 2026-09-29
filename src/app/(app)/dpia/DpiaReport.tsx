/** Presentational — the populated DPIA screening register. No interactivity, so no 'use client'. */
import NextLink from 'next/link';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { PageHeader } from '@molecules/PageHeader';
import { StatCard } from '@molecules/StatCard';
import { Table } from '@molecules/Table';
import { formatDate } from '@shared/lib';
import type { DpiaRecord } from '@shared/mock/dpia';
import { dpiaRiskLabel, dpiaStatusLabel } from './DpiaMessages';
import type { DpiaMessages } from './DpiaMessages';

const STATUS_TONES = {
  'not-started': 'neutral',
  'in-progress': 'warning',
  completed: 'success',
} as const;
const RISK_TONES = { low: 'success', medium: 'warning', high: 'danger' } as const;

function DpiaTable({ t, rows }: { t: DpiaMessages; rows: readonly DpiaRecord[] }) {
  return (
    <Table label={t.tableCaption}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t.tableActivity}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableReason}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableRiskLevel}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableStatus}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableUpdated}</Table.HeaderCell>
          <Table.HeaderCell align="end">{t.tableActions}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((dpia) => (
          <Table.Row key={dpia.id}>
            <Table.Cell isTruncated>
              <NextLink href={`/dpia/${dpia.id}`} className="hover:underline">
                <Text as="span" weight="medium">
                  {dpia.activityName}
                </Text>
              </NextLink>
            </Table.Cell>
            <Table.Cell isTruncated>
              <Text as="span" size="sm" tone="muted">
                {dpia.requiredReason}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Badge tone={RISK_TONES[dpia.riskLevel]} variant="outline">
                {dpiaRiskLabel(t, dpia.riskLevel)}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <Badge tone={STATUS_TONES[dpia.status]}>{dpiaStatusLabel(t, dpia.status)}</Badge>
            </Table.Cell>
            <Table.Cell isNowrap>
              <Text as="span" size="xs" tone="muted">
                {formatDate(dpia.updatedAt)}
              </Text>
            </Table.Cell>
            <Table.Cell align="end">
              <Button asChild variant="ghost" size="sm">
                <NextLink href={`/dpia/${dpia.id}`}>{t.viewLabel}</NextLink>
              </Button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export function DpiaReport({
  t,
  pageLabel,
  pageRefTag,
  pageDescription,
  dpias,
  screenedCount,
  clearedCount,
  completedCount,
  highRiskCount,
}: {
  t: DpiaMessages;
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  dpias: readonly DpiaRecord[];
  screenedCount: number;
  clearedCount: number;
  completedCount: number;
  highRiskCount: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={pageLabel} refTag={pageRefTag} description={pageDescription} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.kpiScreened} value={screenedCount} />
        <StatCard label={t.kpiRequired} value={dpias.length} tone="warning" />
        <StatCard label={t.kpiCompleted} value={completedCount} tone="success" />
        <StatCard label={t.kpiHighRisk} value={highRiskCount} tone="danger" />
      </div>

      <DpiaTable t={t} rows={dpias} />

      {clearedCount > 0 && (
        <Text size="xs" tone="muted">
          {t.clearedNote.replace('{count}', String(clearedCount))}
        </Text>
      )}
    </div>
  );
}
