'use client';

/**
 * The populated register's activities table. Split out of RopaList.tsx so
 * that file stays under the line cap — this module owns row rendering only.
 * Prototype source: .fx-table / .rp-row in app.html.
 */
import NextLink from 'next/link';
import { Check, Pencil } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { IconButton } from '@atoms/IconButton';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { Table } from '@molecules/Table';
import { IDENTIFIER_LABELS, SENSITIVE_IDENTIFIERS } from '@shared/mock/data-map';
import type { ActivityStatus } from '@shared/mock/ropa';
import type { RopaMessages } from './RopaMessages';

/** Row count for the loading skeleton — enough to fill a typical viewport without excess DOM. */
const SKELETON_ROW_COUNT = 6;

export type ActivityRow = {
  id: string;
  refCode: string;
  name: string;
  principals: string;
  dataCategories: string[];
  basisLabel: string;
  retention: string;
  ownerName: string;
  ownerInitials: string;
  status: ActivityStatus;
  evidence: string[];
  confidence: number | undefined;
  issues: string[];
};

const STATUS_TONES = {
  approved: 'success',
  'needs-review': 'warning',
  'ai-draft': 'accent',
} as const;

function statusLabel(t: RopaMessages, status: ActivityStatus): string {
  if (status === 'approved') return t.statusApproved;
  if (status === 'needs-review') return t.statusNeedsReview;
  return t.statusAiDraft;
}

/** "Consent — s.6" → { name: "Consent", ref: "s.6" }; falls back gracefully if unsplit. */
function splitBasisLabel(basisLabel: string): { name: string; ref: string | undefined } {
  const [name, ref] = basisLabel.split(' — ');
  return { name: name ?? basisLabel, ref };
}

/** `dataCategories` from the API are `identifier_type_key` values (`aadhaar`, `device_ids`,
 * …) — the label a real key doesn't have (a legacy free-text category, if any survive)
 * falls back to showing the key as-is rather than disappearing. */
const IDENTIFIER_LABELS_BY_KEY: Record<string, string | undefined> = IDENTIFIER_LABELS;

function categoryLabel(key: string): string {
  return IDENTIFIER_LABELS_BY_KEY[key] ?? key;
}

function isSensitiveCategory(key: string): boolean {
  return (SENSITIVE_IDENTIFIERS as readonly string[]).includes(key);
}

// ---------------------------------------------------------------------------
// Activity + evidence hint cell
// ---------------------------------------------------------------------------
function ActivityCell({ activity }: { activity: ActivityRow }) {
  return (
    <Table.Cell>
      <NextLink href={`/ropa/${activity.id}`} className="hover:underline">
        <span className="flex flex-wrap items-baseline gap-1.5">
          <Text as="span" size="xs" tone="brand" isMono>
            {activity.refCode}
          </Text>
          <Text as="span" size="sm" weight="medium">
            {activity.name}
          </Text>
        </span>
      </NextLink>
      {activity.evidence.length > 0 && (
        <Text as="span" size="2xs" tone="muted" isTruncated className="block">
          {activity.evidence.slice(0, 2).join(' · ')}
        </Text>
      )}
    </Table.Cell>
  );
}

function CategoriesCell({ dataCategories }: { dataCategories: string[] }) {
  return (
    <Table.Cell>
      <div className="flex flex-wrap gap-1">
        {dataCategories.map((category) => (
          <Badge
            key={category}
            size="xs"
            variant="soft"
            tone={isSensitiveCategory(category) ? 'danger' : 'neutral'}
          >
            {categoryLabel(category)}
          </Badge>
        ))}
      </div>
    </Table.Cell>
  );
}

function BasisCell({ basisLabel, retention }: { basisLabel: string; retention: string }) {
  const { name, ref } = splitBasisLabel(basisLabel);
  return (
    <Table.Cell>
      <Text as="span" size="xs" weight="medium" className="block">
        {name}
      </Text>
      <Text as="span" size="2xs" tone="muted" isMono isTruncated className="block">
        {[ref, retention].filter(Boolean).join(' · ')}
      </Text>
    </Table.Cell>
  );
}

function StatusCell({ t, activity }: { t: RopaMessages; activity: ActivityRow }) {
  const subtext = [
    activity.confidence !== undefined ? `${String(activity.confidence)}%` : undefined,
    `${String(activity.evidence.length)} ${t.tableSourcesSuffix}`,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Table.Cell>
      <Badge tone={STATUS_TONES[activity.status]}>{statusLabel(t, activity.status)}</Badge>
      <Text as="span" size="2xs" tone="muted" isMono className="mt-1 block">
        {subtext}
        {activity.issues.length > 0 && (
          <Text as="span" size="2xs" tone="warning" isMono weight="medium">
            {' '}
            · ! {activity.issues.join(', ')}
          </Text>
        )}
      </Text>
    </Table.Cell>
  );
}

function ActionsCell({
  t,
  activity,
  onApprove,
}: {
  t: RopaMessages;
  activity: ActivityRow;
  onApprove: (id: string) => void;
}) {
  return (
    <Table.Cell align="end">
      <div className="flex items-center justify-end gap-1">
        {activity.status !== 'approved' && (
          <IconButton
            label={t.actionApprove}
            variant="outline"
            tone="neutral"
            size="xs"
            onClick={() => {
              onApprove(activity.id);
            }}
          >
            <Check className="size-3.5" />
          </IconButton>
        )}
        <Button asChild variant="outline" tone="neutral" size="xs" aria-label={t.actionEdit}>
          <NextLink href={`/ropa/${activity.id}/edit`}>
            <Pencil className="size-3.5" />
          </NextLink>
        </Button>
      </div>
    </Table.Cell>
  );
}

// ---------------------------------------------------------------------------
// One activity row — extracted so the table stays a thin composition
// ---------------------------------------------------------------------------
function ActivityRowCells({
  t,
  activity,
  onApprove,
}: {
  t: RopaMessages;
  activity: ActivityRow;
  onApprove: (id: string) => void;
}) {
  return (
    <Table.Row>
      <ActivityCell activity={activity} />
      <Table.Cell>
        <Text as="span" size="xs" isMono weight="medium">
          {activity.principals}
        </Text>
      </Table.Cell>
      <CategoriesCell dataCategories={activity.dataCategories} />
      <BasisCell basisLabel={activity.basisLabel} retention={activity.retention} />
      <Table.Cell isTruncated>
        <Text as="span" size="xs" isMono weight="medium">
          {activity.ownerName}
        </Text>
      </Table.Cell>
      <StatusCell t={t} activity={activity} />
      <ActionsCell t={t} activity={activity} onApprove={onApprove} />
    </Table.Row>
  );
}

// ---------------------------------------------------------------------------
// Activities table — 7 columns including Actions
// ---------------------------------------------------------------------------
function ActivitiesTableHeader({ t }: { t: RopaMessages }) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>{t.tableActivity}</Table.HeaderCell>
        <Table.HeaderCell>{t.tablePrincipals}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableCategories}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableBasis}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableOwner}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableStatus}</Table.HeaderCell>
        <Table.HeaderCell align="end">{t.tableActions}</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}

/** One skeleton row, shaped like `ActivityRowCells` — a ref-code-plus-name pair,
 * a couple of badge chips, two-line basis text, and a status badge — rather
 * than one generic bar standing in for a data-dense row. */
function ActivityRowSkeleton() {
  return (
    <Table.Row>
      <Table.Cell>
        <span className="flex flex-wrap items-baseline gap-1.5">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-4 w-32" />
        </span>
        <Skeleton className="mt-1.5 h-3 w-28" />
      </Table.Cell>
      <Table.Cell>
        <Skeleton className="h-3 w-16" />
      </Table.Cell>
      <Table.Cell>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <Skeleton className="h-3 w-20" />
      </Table.Cell>
      <Table.Cell>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="mt-1 h-3 w-24" />
      </Table.Cell>
      <Table.Cell align="end">
        <div className="flex justify-end gap-1">
          <Skeleton shape="circle" className="size-7" />
          <Skeleton shape="circle" className="size-7" />
        </div>
      </Table.Cell>
    </Table.Row>
  );
}

/** Loading placeholder for the register — same Card/Table chrome and real
 * column headers as the loaded table, so nothing shifts once data arrives. */
export function ActivitiesTableSkeleton({ t }: { t: RopaMessages }) {
  return (
    <Card variant="outline" size="none" className="overflow-hidden" aria-busy>
      <Table label={t.tableCaption}>
        <ActivitiesTableHeader t={t} />
        <Table.Body>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <ActivityRowSkeleton key={index} />
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}

export function ActivitiesTable({
  t,
  rows,
  onApprove,
}: {
  t: RopaMessages;
  rows: readonly ActivityRow[];
  onApprove: (id: string) => void;
}) {
  return (
    <Card variant="outline" size="none" className="overflow-hidden">
      <Table label={t.tableCaption}>
        <ActivitiesTableHeader t={t} />
        <Table.Body>
          {rows.map((activity) => (
            <ActivityRowCells key={activity.id} t={t} activity={activity} onApprove={onApprove} />
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}
