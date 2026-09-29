'use client';

/**
 * Every location a scan found personal data in — the pointer, never the data.
 *
 * The masked sample column is what makes a finding actionable ("is this really a
 * PAN, or a part number that looks like one?") without the product ever holding
 * the value it is showing you.
 */
import { ExternalLink } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Text } from '@atoms/Text';
import { Alert } from '@molecules/Alert';
import { EmptyState } from '@molecules/EmptyState';
import { IconButton } from '@atoms/IconButton';
import { Table } from '@molecules/Table';
import type { FindingStatus, SourceFinding } from '@shared/mock/source-details';
import { formatMessage } from '../format-message';
import type { SourceDetailMessages } from './SourceDetail.types';

const STATUS_TONES: Record<FindingStatus, 'danger' | 'warning' | 'neutral'> = {
  open: 'danger',
  acknowledged: 'warning',
  sample: 'neutral',
};

function statusLabel(status: FindingStatus, t: SourceDetailMessages): string {
  if (status === 'open') return t.findingStatusOpen;
  if (status === 'acknowledged') return t.findingStatusAcknowledged;
  return t.findingStatusSample;
}

function IdentifierBadges({ identifiers }: { identifiers: SourceFinding['identifiers'] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {identifiers.map((identifier) => (
        <Badge
          key={identifier.label}
          size="xs"
          variant="outline"
          tone={identifier.isSensitive ? 'danger' : 'neutral'}
        >
          {identifier.label}
        </Badge>
      ))}
    </div>
  );
}

function FindingRow({
  finding,
  t,
  onOpenExternal,
}: {
  finding: SourceFinding;
  t: SourceDetailMessages;
  onOpenExternal: (location: string) => void;
}) {
  return (
    <Table.Row>
      <Table.Cell>
        <Text as="span" size="sm" weight="medium" className="block">
          {finding.location}
        </Text>
        <Text as="span" size="xs" tone="muted" className="block">
          {finding.locationDetail}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <IdentifierBadges identifiers={finding.identifiers} />
      </Table.Cell>
      <Table.Cell align="end" isNowrap>
        <Text as="span" size="xs" isMono tone="muted">
          {finding.items}
        </Text>
      </Table.Cell>
      <Table.Cell align="end" isNowrap>
        <Text as="span" size="xs" isMono tone="muted">
          {finding.confidence}
        </Text>
      </Table.Cell>
      <Table.Cell isNowrap>
        <Text as="span" size="xs" isMono tone="subtle">
          {finding.maskedSample}
        </Text>
      </Table.Cell>
      <Table.Cell isNowrap>
        <Badge size="xs" tone={STATUS_TONES[finding.status]}>
          {statusLabel(finding.status, t)}
        </Badge>
      </Table.Cell>
      <Table.Cell align="end">
        <IconButton
          label={t.findingsOpenExternalLabel}
          variant="ghost"
          size="sm"
          onClick={() => {
            onOpenExternal(finding.location);
          }}
        >
          <ExternalLink className="size-4" />
        </IconButton>
      </Table.Cell>
    </Table.Row>
  );
}

export function FindingsPanel({
  findings,
  isSample,
  sourceName,
  t,
  onOpenExternal,
}: {
  findings: readonly SourceFinding[];
  isSample: boolean;
  sourceName: string;
  t: SourceDetailMessages;
  onOpenExternal: (location: string) => void;
}) {
  if (findings.length === 0) {
    return (
      <EmptyState
        label={isSample ? t.findingsEmptyTitle : t.findingsCleanTitle}
        description={isSample ? t.findingsEmptyDescription : t.findingsCleanDescription}
        tone={isSample ? 'neutral' : 'brand'}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {isSample ? (
        <Alert tone="info" variant="outline" label={t.findingsSampleNotice} size="sm" />
      ) : null}
      <Table label={t.findingsTab} isHoverable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>{t.findingsLocation}</Table.HeaderCell>
            <Table.HeaderCell>{t.findingsIdentifier}</Table.HeaderCell>
            <Table.HeaderCell align="end">{t.findingsItems}</Table.HeaderCell>
            <Table.HeaderCell align="end">{t.findingsConfidence}</Table.HeaderCell>
            <Table.HeaderCell>{t.findingsSample}</Table.HeaderCell>
            <Table.HeaderCell>{t.findingsStatus}</Table.HeaderCell>
            <Table.HeaderCell align="end" />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {findings.map((finding) => (
            <FindingRow key={finding.id} finding={finding} t={t} onOpenExternal={onOpenExternal} />
          ))}
        </Table.Body>
      </Table>
      <Text size="xs" tone="subtle">
        {formatMessage(t.findingsFooterMasked, { name: sourceName })}
      </Text>
    </div>
  );
}
