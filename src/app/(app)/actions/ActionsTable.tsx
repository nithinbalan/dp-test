'use client';

/** Table of action items with an inline mark-done control. */
import NextLink from 'next/link';
import type { Route } from 'next';
import { Check } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { IconButton } from '@atoms/IconButton';
import { Text } from '@atoms/Text';
import { Table } from '@molecules/Table';
import { formatDate } from '@shared/lib';
import type { ActionItem } from '@shared/mock/grc';
import { actionPriorityLabel, actionSourceLabel, actionStatusLabel } from './ActionsMessages';
import type { ActionsMessages } from './ActionsMessages';

const STATUS_TONES = { todo: 'neutral', 'in-progress': 'warning', done: 'success' } as const;
const PRIORITY_TONES = { high: 'danger', medium: 'warning', low: 'neutral' } as const;

// `typedRoutes` only recognises a template literal it can see directly in JSX;
// a lookup table like this one defeats that static analysis even though both
// branches build a real route, so the cast is required at construction — see
// the matching note in `risks/[id]/page.tsx`, which has the same shape.
const SOURCE_HREF: Record<ActionItem['sourceType'], (ref: string) => Route> = {
  risk: (ref) => `/risks/${ref}` as Route,
  dpia: (ref) => `/dpia/${ref}` as Route,
};

export type ActionRow = ActionItem & { ownerName: string };

export function ActionsTable({
  t,
  rows,
  onMarkDone,
}: {
  t: ActionsMessages;
  rows: readonly ActionRow[];
  onMarkDone: (action: ActionRow) => void;
}) {
  return (
    <Table label={t.tableCaption}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>{t.tableAction}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableSource}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableOwner}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableDue}</Table.HeaderCell>
          <Table.HeaderCell>{t.tablePriority}</Table.HeaderCell>
          <Table.HeaderCell>{t.tableStatus}</Table.HeaderCell>
          <Table.HeaderCell align="end">{t.tableActions}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((action) => (
          <Table.Row key={action.id}>
            <Table.Cell isTruncated>
              <Text as="span" weight="medium">
                {action.title}
              </Text>
            </Table.Cell>
            <Table.Cell isTruncated>
              <NextLink
                href={SOURCE_HREF[action.sourceType](action.sourceRef)}
                className="hover:underline"
              >
                <Text as="span" size="xs" tone="muted" isMono>
                  {actionSourceLabel(t, action.sourceType)} · {action.sourceRef}
                </Text>
              </NextLink>
            </Table.Cell>
            <Table.Cell>{action.ownerName}</Table.Cell>
            <Table.Cell isNowrap>
              <Text as="span" size="xs" tone="muted">
                {formatDate(action.dueDate)}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Badge tone={PRIORITY_TONES[action.priority]} variant="outline">
                {actionPriorityLabel(t, action.priority)}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <Badge tone={STATUS_TONES[action.status]}>
                {actionStatusLabel(t, action.status)}
              </Badge>
            </Table.Cell>
            <Table.Cell align="end">
              {action.status !== 'done' && (
                <IconButton
                  label={t.markDoneLabel}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onMarkDone(action);
                  }}
                >
                  <Check className="size-4" />
                </IconButton>
              )}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}
