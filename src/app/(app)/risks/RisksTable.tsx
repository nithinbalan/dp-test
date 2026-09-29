'use client';

/** Table of risks for the Risk Register. */
import NextLink from 'next/link';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { Table } from '@molecules/Table';
import type { Risk } from '@shared/mock/grc';
import { riskLevelLabel, riskSourceLabel, riskStatusLabel } from './RisksMessages';
import type { RisksMessages } from './RisksMessages';

const STATUS_TONES = { open: 'danger', mitigating: 'warning', closed: 'success' } as const;
const LEVEL_TONES = {
  low: 'neutral',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
} as const;

export function RisksTable({ t, rows }: { t: RisksMessages; rows: readonly Risk[] }) {
  return (
    <Table label={t.tableCaption}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t.tableRisk}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableDomain}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableSource}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableLevel}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableStatus}</Table.HeaderCell>
          <Table.HeaderCell align="end">{t.tableActions}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((risk) => (
          <Table.Row key={risk.id}>
            <Table.Cell isTruncated>
              <NextLink href={`/risks/${risk.id}`} className="hover:underline">
                <Text as="span" weight="medium">
                  {risk.title}
                </Text>
              </NextLink>
            </Table.Cell>
            <Table.Cell isTruncated>{risk.domain}</Table.Cell>
            <Table.Cell isTruncated>
              <Text as="span" size="xs" tone="muted" isMono>
                {riskSourceLabel(t, risk.sourceType)} · {risk.sourceRef}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Badge
                tone={LEVEL_TONES[risk.level]}
                variant={risk.level === 'critical' ? 'solid' : 'soft'}
              >
                {riskLevelLabel(t, risk.level)}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <Badge tone={STATUS_TONES[risk.status]} variant="outline">
                {riskStatusLabel(t, risk.status)}
              </Badge>
            </Table.Cell>
            <Table.Cell align="end">
              <Button asChild variant="ghost" size="sm">
                <NextLink href={`/risks/${risk.id}`}>{t.viewLabel}</NextLink>
              </Button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
