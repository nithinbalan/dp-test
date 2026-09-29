'use client';

/** Owns search/filter state and modals for the Notice Manager register — real data via `useNotices()`. */
import type { ReactNode } from 'react';
import NextLink from 'next/link';
import {
  CheckCheck,
  ChevronRight,
  FileText,
  Globe,
  Network,
  Pencil,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { type NoticeDetail, type NoticesData, type NoticeSummary } from '@shared/hooks';
import { PublicPreviewModal } from './components/PublicPreviewModal';
import { ShareNoticeModal } from './components/ShareNoticeModal';
import { FilterRow, FilterRowSkeleton } from './NoticesFilterRow';
import type { NoticesMessages } from './NoticesMessages';
import { RegisterPagination } from './NoticesPagination';
import { NoticesTable, NoticesTableSkeleton } from './NoticesTable';
import { useNoticesListState } from './use-notices-list-state';

function FlowStep({ icon, label, isAi }: { icon: ReactNode; label: string; isAi?: boolean }) {
  return (
    <span
      className={
        isAi
          ? 'text-brand-fg inline-flex items-center gap-1.5 text-xs font-semibold'
          : 'text-fg-muted inline-flex items-center gap-1.5 text-xs font-medium'
      }
    >
      {icon}
      {label}
    </span>
  );
}

/** RoPA → Jethur AI → Review → Publish → output pipeline strip — matches the prototype's `.nt-flow`. */
function FlowStrip({ t }: { t: NoticesMessages }) {
  const chevron = <ChevronRight className="text-fg-subtle size-3.5" />;
  return (
    <div className="border-border-default bg-bg-surface flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5">
      <FlowStep icon={<Network className="size-3.5" />} label={t.flowStepRopa} />
      {chevron}
      <FlowStep icon={<Sparkles className="size-3.5" />} label={t.flowStepAi} isAi />
      {chevron}
      <FlowStep icon={<Pencil className="size-3.5" />} label={t.flowStepReview} />
      {chevron}
      <FlowStep icon={<CheckCheck className="size-3.5" />} label={t.flowStepPublish} />
      {chevron}
      <FlowStep icon={<Globe className="size-3.5" />} label={t.flowStepOutput} />
    </div>
  );
}

/** Footer bar — matches the prototype's `.ar-foot`. */
function FooterBar({ t }: { t: NoticesMessages }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
      <div className="flex items-center gap-1.5">
        <Network className="text-brand-solid size-3.5" />
        <Text as="span" size="2xs" tone="subtle" isMono className="uppercase">
          {t.footerSourceNote}
        </Text>
      </div>
      <Text as="span" size="2xs" tone="subtle" isMono className="uppercase">
        {t.footerRefNote}
      </Text>
    </div>
  );
}

/**
 * Same PageHeader, flow strip, filter row, table and footer the loaded page
 * renders — with disabled controls and skeleton bars standing in for
 * data-dependent content, so the page does not shift shape once data
 * arrives. The "Add notice" action is omitted: whether it belongs in the
 * header depends on `hasNotices`, which isn't known yet.
 */
function NoticesLoading({
  pageLabel,
  pageRefTag,
  pageDescription,
  t,
}: {
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  t: NoticesMessages;
}) {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <PageHeader
        refTag={pageRefTag}
        label={pageLabel}
        description={pageDescription}
        actionSlot={<Skeleton className="h-9 w-36 rounded-lg" />}
      />
      <FlowStrip t={t} />
      <div className="flex flex-col gap-4">
        <FilterRowSkeleton t={t} />
        <NoticesTableSkeleton t={t} />
        <FooterBar t={t} />
      </div>
    </div>
  );
}

function EmptyNoticesCard({ t }: { t: NoticesMessages }) {
  return (
    <Card variant="outline" className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="bg-bg-subtle text-fg-muted rounded-pill grid size-12 place-items-center">
        <FileText className="size-6" />
      </div>
      <div className="max-w-md">
        <Text weight="bold" size="lg">
          {t.emptyTitle}
        </Text>
        <Text size="sm" tone="muted" className="mt-1">
          {t.emptyDescription}
        </Text>
      </div>
      <Button asChild tone="brand" startSlot={<Plus className="size-4" />}>
        <NextLink href="/notices/new">{t.cta}</NextLink>
      </Button>
      <Text as="span" size="2xs" tone="subtle" isMono className="tracking-widest uppercase">
        {t.emptyMeta}
      </Text>
    </Card>
  );
}

function NoticeModals({
  t,
  isShareOpen,
  onCloseShare,
  isPreviewOpen,
  onClosePreview,
  notice,
  onOpenPreview,
}: {
  t: NoticesMessages;
  isShareOpen: boolean;
  onCloseShare: () => void;
  isPreviewOpen: boolean;
  onClosePreview: () => void;
  notice: NoticeDetail | null | undefined;
  onOpenPreview: (notice: NoticeDetail) => void;
}) {
  return (
    <>
      <ShareNoticeModal
        isOpen={isShareOpen}
        onClose={onCloseShare}
        notice={notice ?? null}
        t={t}
        onOpenPreview={onOpenPreview}
        onPrintPdf={() => {
          onCloseShare();
          if (notice) onOpenPreview(notice);
          window.setTimeout(() => {
            window.print();
          }, 300);
        }}
      />
      <PublicPreviewModal
        isOpen={isPreviewOpen}
        onClose={onClosePreview}
        notice={notice ?? null}
        messages={{
          previewHeaderTitle: t.previewHeaderTitle,
          previewReadIn: t.previewReadIn,
          previewMachineTranslated: t.previewMachineTranslated,
          previewEffective: t.previewEffective,
          previewPublishedWith: t.previewPublishedWith,
          printCta: t.printCta,
          closeCta: t.closeCta,
          brandDomain: t.brandDomain,
        }}
      />
    </>
  );
}

/** Either the "no results" card or the table plus its pagination row. */
function RegisterResults({
  t,
  filtered,
  paged,
  page,
  pageCount,
  pageSize,
  rangeFrom,
  rangeTo,
  onPageChange,
  onPageSizeChange,
  onOpenPreview,
  onOpenShare,
}: {
  t: NoticesMessages;
  filtered: readonly NoticeSummary[];
  paged: readonly NoticeSummary[];
  page: number;
  pageCount: number;
  pageSize: number;
  rangeFrom: number;
  rangeTo: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onOpenPreview: (id: string) => void;
  onOpenShare: (id: string) => void;
}) {
  if (filtered.length === 0) {
    return (
      <Card variant="outline" className="flex flex-col items-center gap-2 py-12 text-center">
        <Text weight="bold" size="md">
          {t.noResultsTitle}
        </Text>
        <Text size="sm" tone="muted">
          {t.noResultsDescription}
        </Text>
      </Card>
    );
  }

  return (
    <>
      <NoticesTable t={t} rows={paged} onOpenPreview={onOpenPreview} onOpenShare={onOpenShare} />
      <RegisterPagination
        t={t}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        total={filtered.length}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </>
  );
}

function NoticesRegister({
  t,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  languageFilter,
  onLanguageFilterChange,
  availableLanguages,
  filtered,
  paged,
  page,
  pageCount,
  pageSize,
  rangeFrom,
  rangeTo,
  onPageChange,
  onPageSizeChange,
  onOpenPreview,
  onOpenShare,
}: {
  t: NoticesMessages;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  languageFilter: string;
  onLanguageFilterChange: (value: string) => void;
  availableLanguages: readonly string[];
  filtered: readonly NoticeSummary[];
  paged: readonly NoticeSummary[];
  page: number;
  pageCount: number;
  pageSize: number;
  rangeFrom: number;
  rangeTo: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onOpenPreview: (id: string) => void;
  onOpenShare: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <FilterRow
        t={t}
        query={query}
        onQueryChange={onQueryChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        languageFilter={languageFilter}
        onLanguageFilterChange={onLanguageFilterChange}
        availableLanguages={availableLanguages}
      />

      <RegisterResults
        t={t}
        filtered={filtered}
        paged={paged}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onOpenPreview={onOpenPreview}
        onOpenShare={onOpenShare}
      />

      <FooterBar t={t} />
    </div>
  );
}

function NoticesLoaded({
  pageLabel,
  pageRefTag,
  pageDescription,
  t,
  state,
}: {
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  t: NoticesMessages;
  state: ReturnType<typeof useNoticesListState> & { data: NoticesData };
}) {
  const hasNotices = state.data.notices.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        refTag={pageRefTag}
        label={pageLabel}
        description={pageDescription}
        actionSlot={
          hasNotices ? (
            <Button asChild tone="brand" startSlot={<Plus className="size-4" />}>
              <NextLink href="/notices/new">{t.addNoticeCta}</NextLink>
            </Button>
          ) : undefined
        }
      />

      <FlowStrip t={t} />

      {!hasNotices ? (
        <EmptyNoticesCard t={t} />
      ) : (
        <NoticesRegister
          t={t}
          query={state.query}
          onQueryChange={state.setQuery}
          statusFilter={state.statusFilter}
          onStatusFilterChange={state.setStatusFilter}
          languageFilter={state.languageFilter}
          onLanguageFilterChange={state.setLanguageFilter}
          availableLanguages={state.availableLanguages}
          filtered={state.filtered}
          paged={state.paged}
          page={state.page}
          pageCount={state.pageCount}
          pageSize={state.pageSize}
          rangeFrom={state.rangeFrom}
          rangeTo={state.rangeTo}
          onPageChange={state.setPage}
          onPageSizeChange={state.setPageSize}
          onOpenPreview={state.openPreview}
          onOpenShare={state.openShare}
        />
      )}

      <NoticeModals
        t={t}
        isShareOpen={state.isShareOpen}
        onCloseShare={() => {
          state.setIsShareOpen(false);
        }}
        isPreviewOpen={state.isPreviewOpen}
        onClosePreview={() => {
          state.setIsPreviewOpen(false);
        }}
        notice={state.modalNoticeDetail}
        onOpenPreview={(n) => {
          state.setIsShareOpen(false);
          state.setActiveModalNoticeId(n.id);
          state.setIsPreviewOpen(true);
        }}
      />
    </div>
  );
}

export function NoticesList({
  pageLabel,
  pageRefTag,
  pageDescription,
  t,
}: {
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  t: NoticesMessages;
}) {
  const state = useNoticesListState();

  if (state.isLoading) {
    return (
      <NoticesLoading
        pageLabel={pageLabel}
        pageRefTag={pageRefTag}
        pageDescription={pageDescription}
        t={t}
      />
    );
  }

  if (state.isError || !state.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader refTag={pageRefTag} label={pageLabel} description={pageDescription} />
        <EmptyState label={t.loadErrorTitle} description={t.loadErrorDescription} tone="danger" />
      </div>
    );
  }

  return (
    <NoticesLoaded
      pageLabel={pageLabel}
      pageRefTag={pageRefTag}
      pageDescription={pageDescription}
      t={t}
      state={{ ...state, data: state.data }}
    />
  );
}
