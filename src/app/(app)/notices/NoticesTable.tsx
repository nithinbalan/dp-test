/** The Notice Manager table, its header, row cells and loading skeleton. */
import { Eye, Pencil, Share2, UploadCloud } from 'lucide-react';
import NextLink from 'next/link';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { Table } from '@molecules/Table';
import { NT_L8 } from '@app/api/notices/templates';
import { formatDate } from '@shared/lib';
import { type NoticeStatus, type NoticeSummary } from '@shared/hooks';
import type { NoticesMessages } from './NoticesMessages';

const STATUS_TONES = { published: 'success', draft: 'warning' } as const;
/** Row count for the loading skeleton — enough to fill a typical viewport without excess DOM. */
const SKELETON_ROW_COUNT = 6;

function statusLabel(t: NoticesMessages, status: NoticeStatus): string {
  return status === 'published' ? t.statusPublished : t.statusDraft;
}

function ActivityCell({ t, notice }: { t: NoticesMessages; notice: NoticeSummary }) {
  if (notice.activityName) {
    return (
      <div className="flex flex-col">
        <Text as="span" size="sm">
          {notice.activityName}
        </Text>
        <Text as="span" size="xs" tone="muted" isMono>
          {notice.activityRef ?? notice.refCode}
        </Text>
      </div>
    );
  }
  return (
    <div className="flex flex-col">
      <Text as="span" size="sm">
        {t.activityNotLinkedTitle}
      </Text>
      <Text as="span" size="xs" tone="muted" isMono>
        {t.activityNotLinkedCaption}
      </Text>
    </div>
  );
}

function LanguageCell({ t, notice }: { t: NoticesMessages; notice: NoticeSummary }) {
  const primaryLang = notice.language || 'English';
  const info = NT_L8.find((l) => l.en === primaryLang) ?? { en: primaryLang, nat: primaryLang };
  const extraCount = (notice.langs?.length ?? 1) - 1;

  return (
    <div className="flex flex-col">
      <Text as="span" size="sm">
        {info.nat}
      </Text>
      {extraCount > 0 && (
        <Text as="span" size="2xs" tone="muted">
          {t.translationCountSuffix
            .replace('{count}', String(extraCount))
            .replace('{plural}', extraCount > 1 ? 's' : '')}
        </Text>
      )}
    </div>
  );
}

function RowActions({
  t,
  notice,
  onOpenPreview,
  onOpenShare,
}: {
  t: NoticesMessages;
  notice: NoticeSummary;
  onOpenPreview: (id: string) => void;
  onOpenShare: (id: string) => void;
}) {
  return (
    <div
      className="flex justify-end gap-1"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {notice.status === 'published' && (
        <Button
          variant="ghost"
          size="sm"
          className="w-8 px-0"
          aria-label={t.viewLabel}
          onClick={() => {
            onOpenPreview(notice.id);
          }}
        >
          <Eye aria-hidden className="size-4" />
        </Button>
      )}
      <Button asChild variant="ghost" size="sm" className="w-8 px-0" aria-label={t.editLabel}>
        <NextLink href={`/notices/${notice.id}`}>
          <Pencil aria-hidden className="size-4" />
        </NextLink>
      </Button>
      {notice.status === 'published' ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-8 px-0"
          aria-label={t.shareLabel}
          onClick={() => {
            onOpenShare(notice.id);
          }}
        >
          <Share2 aria-hidden className="size-4" />
        </Button>
      ) : (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-8 px-0"
          aria-label={t.publishRowLabel}
        >
          <NextLink href={`/notices/${notice.id}`}>
            <UploadCloud aria-hidden className="size-4" />
          </NextLink>
        </Button>
      )}
    </div>
  );
}

function NoticesTableHeader({ t }: { t: NoticesMessages }) {
  return (
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>{t.tableNotice}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableActivity}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableLanguage}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableStatus}</Table.HeaderCell>
        <Table.HeaderCell>{t.tableUpdated}</Table.HeaderCell>
        <Table.HeaderCell align="end">{t.tableActions}</Table.HeaderCell>
      </Table.Row>
    </Table.Header>
  );
}

/** One skeleton row, shaped like the real one — a name-plus-ref-code pair, an
 * activity two-liner, a language two-liner, a status badge, a date, and three
 * action-button placeholders — rather than a single generic bar. */
function NoticeRowSkeleton() {
  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex flex-col">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-1.5 h-3 w-24" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex flex-col">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1.5 h-3 w-20" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex flex-col">
          <Skeleton className="h-4 w-20" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <Skeleton className="h-5 w-20" />
      </Table.Cell>
      <Table.Cell>
        <Skeleton className="h-3 w-20" />
      </Table.Cell>
      <Table.Cell align="end">
        <div className="flex justify-end gap-1">
          <Skeleton shape="circle" className="size-8" />
          <Skeleton shape="circle" className="size-8" />
          <Skeleton shape="circle" className="size-8" />
        </div>
      </Table.Cell>
    </Table.Row>
  );
}

/** Loading placeholder for the register — same Card/Table chrome and real
 * column headers as the loaded table, so nothing shifts once data arrives. */
export function NoticesTableSkeleton({ t }: { t: NoticesMessages }) {
  return (
    <Card variant="outline" size="none" className="overflow-hidden" aria-busy>
      <Table label={t.tableCaption}>
        <NoticesTableHeader t={t} />
        <Table.Body>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <NoticeRowSkeleton key={index} />
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}

export function NoticesTable({
  t,
  rows,
  onOpenPreview,
  onOpenShare,
}: {
  t: NoticesMessages;
  rows: readonly NoticeSummary[];
  onOpenPreview: (id: string) => void;
  onOpenShare: (id: string) => void;
}) {
  return (
    <Card variant="outline" size="none" className="overflow-hidden">
      <Table label={t.tableCaption}>
        <NoticesTableHeader t={t} />
        <Table.Body>
          {rows.map((notice) => (
            <Table.Row key={notice.id}>
              <Table.Cell isTruncated>
                <NextLink href={`/notices/${notice.id}`} className="block hover:underline">
                  <div className="flex flex-col">
                    <Text as="span" weight="bold" size="sm">
                      {notice.name}
                    </Text>
                    <Text as="span" size="xs" tone="muted" isMono>
                      {t.noticeMeta
                        .replace('{ref}', notice.refCode)
                        .replace('{version}', notice.version)}
                    </Text>
                  </div>
                </NextLink>
              </Table.Cell>
              <Table.Cell isTruncated>
                <ActivityCell t={t} notice={notice} />
              </Table.Cell>
              <Table.Cell isNowrap>
                <LanguageCell t={t} notice={notice} />
              </Table.Cell>
              <Table.Cell>
                <Badge tone={STATUS_TONES[notice.status]}>{statusLabel(t, notice.status)}</Badge>
              </Table.Cell>
              <Table.Cell isNowrap>
                <Text as="span" size="xs" tone="muted" isMono>
                  {formatDate(notice.updatedAt)}
                </Text>
              </Table.Cell>
              <Table.Cell align="end">
                <RowActions
                  t={t}
                  notice={notice}
                  onOpenPreview={onOpenPreview}
                  onOpenShare={onOpenShare}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}
