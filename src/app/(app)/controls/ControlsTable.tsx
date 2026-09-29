'use client';

/** Table of controls for the CCM register. */
import NextLink from 'next/link';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { Table } from '@molecules/Table';
import { formatDate } from '@shared/lib';
import type { Control } from '@shared/mock/controls';
import { automationLabel, domainLabel, statusLabel, typeLabel } from './ControlLabels';
import type { ControlsMessages } from './ControlsMessages';

const STATUS_TONES = { pass: 'success', fail: 'danger', pending: 'warning' } as const;

export function ControlsTable({ t, rows }: { t: ControlsMessages; rows: readonly Control[] }) {
  return (
    <Table label={t.tableCaption}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t.tableDomain}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableControl}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableType}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableStatus}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableAutomation}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableLastChecked}</Table.HeaderCell>
          <Table.HeaderCell align="end">{t.tableActions}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((control) => (
          <Table.Row key={control.id}>
            <Table.Cell isTruncated>
              <Text as="span" size="xs" tone="muted">
                {domainLabel(t, control.domain)}
              </Text>
            </Table.Cell>
            <Table.Cell isTruncated>
              <NextLink href={`/controls/${control.id}`} className="hover:underline">
                <Text as="span" weight="medium">
                  {control.title}
                </Text>
              </NextLink>
            </Table.Cell>
            <Table.Cell>{typeLabel(t, control.type)}</Table.Cell>
            <Table.Cell>
              <Badge tone={STATUS_TONES[control.status]}>{statusLabel(t, control.status)}</Badge>
            </Table.Cell>
            <Table.Cell>{automationLabel(t, control.automation)}</Table.Cell>
            <Table.Cell isNowrap>
              <Text as="span" size="xs" tone="muted">
                {formatDate(control.lastCheckedAt)}
              </Text>
            </Table.Cell>
            <Table.Cell align="end">
              <Button asChild variant="ghost" size="sm">
                <NextLink href={`/controls/${control.id}`}>{t.viewLabel}</NextLink>
              </Button>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
