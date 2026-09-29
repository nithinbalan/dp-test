/** The Employees roster table — one row per person, name/email/department/awareness. */
import { Bell } from 'lucide-react';
import { Avatar } from '@atoms/Avatar';
import { Badge } from '@atoms/Badge';
import { Card } from '@atoms/Card';
import { IconButton } from '@atoms/IconButton';
import { Progress } from '@atoms/Progress';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { Table } from '@molecules/Table';
import type { AwarenessStatus, EmployeeRow } from '@shared/hooks';
import type { EmployeesMessages } from './EmployeesMessages';

/** Row count for the loading skeleton — enough to fill a typical viewport without excess DOM. */
const SKELETON_ROW_COUNT = 6;

const AWARENESS_TONES = {
  certified: 'success',
  'in-progress': 'warning',
  overdue: 'danger',
} as const;
const EM_DASH = '—';

function awarenessLabel(t: EmployeesMessages, status: AwarenessStatus): string {
  if (status === 'certified') return t.awarenessCertified;
  if (status === 'in-progress') return t.awarenessInProgress;
  return t.awarenessOverdue;
}

/** First letter of up to the first two words of a full name. */
function initialsOf(fullName: string): string {
  const letters = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase());
  return letters.join('') || '?';
}

function EmployeeIdentityCell({ row }: { row: EmployeeRow }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar label={row.fullName} initials={initialsOf(row.fullName)} size="xs" />
      <div className="flex min-w-0 flex-col">
        <Text as="span" weight="medium" isTruncated>
          {row.fullName}
        </Text>
        <Text as="span" size="xs" tone="muted" isMono isTruncated>
          {row.code}
          {row.designation !== null ? ` · ${row.designation}` : ''}
        </Text>
      </div>
    </div>
  );
}

function EmployeeAwarenessCell({ t, row }: { t: EmployeesMessages; row: EmployeeRow }) {
  const tone = AWARENESS_TONES[row.awarenessStatus];
  return (
    <div className="flex w-32 flex-col gap-1.5">
      <Progress value={row.awarenessPercent} label={t.tableAwareness} size="sm" tone={tone} />
      <div className="flex items-center gap-1.5">
        <Text as="span" size="xs" tone="muted">
          {row.awarenessPercent}%
        </Text>
        <Text as="span" size="xs" tone="muted">
          ·
        </Text>
        <Badge size="xs" tone={tone}>
          {awarenessLabel(t, row.awarenessStatus)}
        </Badge>
      </div>
    </div>
  );
}

function EmployeesTableHeader({ t }: { t: EmployeesMessages }) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>{t.tableEmployee}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableEmail}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableDepartment}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableAwareness}</Table.HeaderCell>
        <Table.HeaderCell align="end">{t.tableActions}</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}

/**
 * One skeleton row, shaped exactly like `EmployeeIdentityCell`/`EmployeeAwarenessCell`
 * so the table does not jump when real rows replace it — an avatar circle plus two
 * text lines, not a single generic bar standing in for the whole row.
 */
function EmployeeRowSkeleton() {
  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex items-center gap-2">
          <Skeleton shape="circle" className="size-6 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </Table.Cell>
      <Table.Cell>
        <Skeleton className="h-3 w-36" />
      </Table.Cell>
      <Table.Cell>
        <Skeleton className="h-3 w-24" />
      </Table.Cell>
      <Table.Cell>
        <div className="flex w-32 flex-col gap-1.5">
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </Table.Cell>
      <Table.Cell align="end">
        <Skeleton shape="circle" className="ms-auto size-9" />
      </Table.Cell>
    </Table.Row>
  );
}

/** Loading placeholder for the roster — same Card/Table chrome and real column
 * headers as the loaded table, so nothing shifts once data arrives. */
export function EmployeesTableSkeleton({ t }: { t: EmployeesMessages }) {
  return (
    <Card variant="outline" size="none" className="overflow-hidden" aria-busy>
      <Table label={t.tableCaption}>
        <EmployeesTableHeader t={t} />
        <Table.Body>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <EmployeeRowSkeleton key={index} />
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}

export function EmployeesTable({
  t,
  rows,
  onRemind,
}: {
  t: EmployeesMessages;
  rows: readonly EmployeeRow[];
  onRemind: (name: string) => void;
}) {
  return (
    <Card variant="outline" size="none" className="overflow-hidden">
      <Table label={t.tableCaption}>
        <EmployeesTableHeader t={t} />
        <Table.Body>
          {rows.map((row) => (
            <Table.Row key={row.id}>
              <Table.Cell>
                <EmployeeIdentityCell row={row} />
              </Table.Cell>
              <Table.Cell isTruncated>
                <Text as="span" tone="muted" size="xs" isMono>
                  {row.workEmail ?? EM_DASH}
                </Text>
              </Table.Cell>
              <Table.Cell>{row.departmentName ?? EM_DASH}</Table.Cell>
              <Table.Cell>
                <EmployeeAwarenessCell t={t} row={row} />
              </Table.Cell>
              <Table.Cell align="end">
                <IconButton
                  label={t.remindLabel}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onRemind(row.fullName);
                  }}
                >
                  <Bell className="size-4" />
                </IconButton>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}
