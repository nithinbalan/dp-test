'use client';

/** Table + row-level actions for the Endpoints list. */
import { RadarIcon, RefreshCw, Send } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { IconButton } from '@atoms/IconButton';
import { Text } from '@atoms/Text';
import { Table } from '@molecules/Table';
import type { useToast } from '@shared/hooks';
import { formatDate } from '@shared/lib';
import type { AgentStatus, PiiFinding } from '@shared/mock/devices';
import type { EndpointsMessages } from './EndpointsMessages';

const AGENT_TONES = { active: 'success', outdated: 'warning', 'not-installed': 'neutral' } as const;

export type EndpointRow = {
  personId: string;
  name: string;
  department: string;
  deviceId: string;
  os: string;
  agentStatus: AgentStatus;
  agentVersion: string;
  hasPii: boolean;
  piiFindings: readonly PiiFinding[];
  lastScanAt: string;
  lastScanLocation: string;
};

function agentLabel(t: EndpointsMessages, status: AgentStatus): string {
  if (status === 'active') return t.agentActive;
  if (status === 'outdated') return t.agentOutdated;
  return t.agentNotInstalled;
}

function RowActions({
  t,
  row,
  onScan,
  onPush,
  onSendLink,
}: {
  t: EndpointsMessages;
  row: EndpointRow;
  onScan: () => void;
  onPush: () => void;
  onSendLink: () => void;
}) {
  if (row.agentStatus === 'not-installed') {
    return (
      <IconButton label={t.sendInstallLabel} variant="ghost" size="sm" onClick={onSendLink}>
        <Send className="size-4" />
      </IconButton>
    );
  }
  if (row.agentStatus === 'outdated') {
    return (
      <IconButton label={t.pushUpdateLabel} variant="ghost" size="sm" onClick={onPush}>
        <RefreshCw className="size-4" />
      </IconButton>
    );
  }
  return (
    <IconButton label={t.scanLabel} variant="ghost" size="sm" onClick={onScan}>
      <RadarIcon className="size-4" />
    </IconButton>
  );
}

function PiiFindingsCell({
  t,
  findings,
}: {
  t: EndpointsMessages;
  findings: readonly PiiFinding[];
}) {
  if (findings.length === 0) {
    return (
      <Text as="span" size="xs" tone="muted">
        {t.noFindings}
      </Text>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {findings.map((finding) => (
        <Badge
          key={finding.label}
          size="xs"
          variant={finding.isSensitive ? 'soft' : 'outline'}
          tone={finding.isSensitive ? 'danger' : 'neutral'}
        >
          {finding.label}
        </Badge>
      ))}
    </div>
  );
}

function EndpointTableRow({
  t,
  row,
  toast,
}: {
  t: EndpointsMessages;
  row: EndpointRow;
  toast: ReturnType<typeof useToast>;
}) {
  return (
    <Table.Row>
      <Table.Cell isTruncated>
        <div className="flex flex-col gap-0.5">
          <Text as="span" size="sm" weight="semibold" className="truncate">
            {row.name}
          </Text>
          <Text as="span" size="2xs" tone="muted" isMono className="truncate">
            {row.department}
          </Text>
        </div>
      </Table.Cell>
      <Table.Cell isNowrap>
        <Badge size="xs" variant="outline" tone="neutral">
          {row.deviceId}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        <Badge size="xs" variant="outline" tone="neutral">
          {row.os}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        <Badge size="xs" tone={AGENT_TONES[row.agentStatus]}>
          {agentLabel(t, row.agentStatus)}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        <PiiFindingsCell t={t} findings={row.piiFindings} />
      </Table.Cell>
      <Table.Cell isNowrap>
        <div className="flex flex-col gap-0.5">
          <Text as="span" size="xs" weight="semibold">
            {row.lastScanAt === '—' ? '—' : formatDate(row.lastScanAt)}
          </Text>
          {row.lastScanLocation !== '' && (
            <Text as="span" size="2xs" tone="muted">
              {row.lastScanLocation}
            </Text>
          )}
        </div>
      </Table.Cell>
      <Table.Cell align="end">
        <RowActions
          t={t}
          row={row}
          onScan={() => {
            toast.show({
              label: t.toastScanStarted.replace('{device}', row.deviceId),
              tone: 'info',
            });
          }}
          onPush={() => {
            toast.show({
              label: t.toastUpdatePushed.replace('{device}', row.deviceId),
              tone: 'success',
            });
          }}
          onSendLink={() => {
            toast.show({ label: t.toastInstallSent.replace('{name}', row.name), tone: 'success' });
          }}
        />
      </Table.Cell>
    </Table.Row>
  );
}

export function EndpointsTable({
  t,
  rows,
  toast,
}: {
  t: EndpointsMessages;
  rows: readonly EndpointRow[];
  toast: ReturnType<typeof useToast>;
}) {
  return (
    <Table label={t.tableCaption}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t.tableEmployee}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableDevice}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableOs}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableAgent}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableFindings}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableLastScan}</Table.HeaderCell>
          <Table.HeaderCell align="end">{t.tableActions}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((row) => (
          <EndpointTableRow key={row.personId} t={t} row={row} toast={toast} />
        ))}
      </Table.Body>
    </Table>
  );
}
