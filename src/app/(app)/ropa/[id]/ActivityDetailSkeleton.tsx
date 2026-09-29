/**
 * Loading placeholder for the RoPA activity detail view. Reuses the real
 * `Panel`/`StatCard` chrome with their real (static, already-known) titles
 * and labels — only the actual fetched values are skeleton blocks — so nothing
 * shifts shape once the activity loads, matching `ActivityDetailContent`'s
 * layout row for row rather than standing in three generic gray boxes.
 */
import NextLink from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Skeleton } from '@atoms/Skeleton';
import { StatCard } from '@molecules/StatCard';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import { Panel } from './ActivityDetailPanels';
import type { ActivityDetailMessages } from './ActivityDetailView.types';

function DetailRowSkeleton({
  label,
  widthClassName = 'w-2/3',
}: {
  label: string;
  widthClassName?: string;
}) {
  return (
    <div className="border-border-default/50 flex items-center gap-3 border-b py-2 last:border-b-0">
      <Text as="span" size="xs" tone="muted" className="w-40 shrink-0">
        {label}
      </Text>
      <Skeleton className={cn('h-4', widthClassName)} />
    </div>
  );
}

function DetailHeaderSkeleton({ t }: { t: ActivityDetailMessages }) {
  return (
    <>
      <Button asChild variant="ghost" size="md" className="w-fit">
        <NextLink href="/ropa" className="flex items-center gap-1.5">
          <ArrowLeft className="size-4" />
          {t.backCta}
        </NextLink>
      </Button>

      {/* Mirrors PageHeader's internal flex layout */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-48 rounded-full" />
          <Skeleton className="h-7 w-72" />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <div className="-mt-4 flex flex-wrap items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-44 rounded-full" />
      </div>
    </>
  );
}

function DetailStatsSkeleton({ t }: { t: ActivityDetailMessages }) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatCard label={t.chipConfidence} value="" isLoading size="xs" />
      <StatCard label={t.chipEvidenceSources} value="" isLoading size="xs" />
      <StatCard label={t.chipLastReviewed} value="" isLoading size="xs" />
      <StatCard label={t.chipProcessors} value="" isLoading size="xs" />
    </div>
  );
}

function FullRecordPanelSkeleton({ t }: { t: ActivityDetailMessages }) {
  return (
    <Panel title={t.fullRecordTitle} sub={t.fullRecordSub}>
      <DetailRowSkeleton label={t.rowActivity} widthClassName="w-3/5" />
      <DetailRowSkeleton label={t.rowPurpose} widthClassName="w-4/5" />
      <DetailRowSkeleton label={t.rowSubjects} widthClassName="w-1/4" />
      <DetailRowSkeleton label={t.rowPersonalData} widthClassName="w-2/3" />
      <DetailRowSkeleton label={t.rowSource} widthClassName="w-2/5" />
      <DetailRowSkeleton label={t.rowOperations} widthClassName="w-1/2" />
      <DetailRowSkeleton label={t.rowSystems} widthClassName="w-full" />
      <DetailRowSkeleton label={t.rowStorage} widthClassName="w-2/5" />
      <DetailRowSkeleton label={t.rowProcessors} widthClassName="w-1/4" />
      <DetailRowSkeleton label={t.rowRecipients} widthClassName="w-1/4" />
      <DetailRowSkeleton label={t.rowCrossBorder} widthClassName="w-2/5" />
      <DetailRowSkeleton label={t.rowLawfulBasis} widthClassName="w-1/3" />
      <DetailRowSkeleton label={t.rowRetention} widthClassName="w-3/5" />
      <DetailRowSkeleton label={t.rowSecurity} widthClassName="w-2/3" />
      <DetailRowSkeleton label={t.rowOwner} widthClassName="w-1/3" />
    </Panel>
  );
}

function EvidencePanelSkeleton({ t }: { t: ActivityDetailMessages }) {
  return (
    <Panel title={t.evidenceTitle} sub={t.evidenceSub}>
      <div className="flex flex-col gap-2 py-1">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Panel>
  );
}

function ApprovalPanelSkeleton({ t }: { t: ActivityDetailMessages }) {
  return (
    <Panel title={t.approvalTitle} sub={t.approvalSub}>
      <DetailRowSkeleton label={t.approvalStatusLabel} widthClassName="w-1/4" />
      <DetailRowSkeleton label={t.approvalReviewer} widthClassName="w-1/3" />
      <DetailRowSkeleton label={t.approvalDate} widthClassName="w-1/4" />
      <DetailRowSkeleton label={t.approvalVersion} widthClassName="w-1/5" />
      <DetailRowSkeleton label={t.approvalSnapshot} widthClassName="w-2/5" />
    </Panel>
  );
}

function HistoryPanelSkeleton({ t }: { t: ActivityDetailMessages }) {
  return (
    <Panel title={t.historyTitle}>
      <div className="flex flex-col gap-2 py-1">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </Panel>
  );
}

function MonitoringPanelSkeleton({ t }: { t: ActivityDetailMessages }) {
  return (
    <Panel title={t.monitoringTitle}>
      <DetailRowSkeleton label={t.monitoringWatching} widthClassName="w-2/3" />
      <DetailRowSkeleton label={t.monitoringOnChange} widthClassName="w-3/5" />
    </Panel>
  );
}

export function ActivityDetailSkeleton({ t }: { t: ActivityDetailMessages }) {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <DetailHeaderSkeleton t={t} />
      <DetailStatsSkeleton t={t} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-start">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <FullRecordPanelSkeleton t={t} />
        </div>
        <div className="flex flex-col gap-4 lg:col-span-2">
          <EvidencePanelSkeleton t={t} />
          <ApprovalPanelSkeleton t={t} />
          <HistoryPanelSkeleton t={t} />
          <MonitoringPanelSkeleton t={t} />
        </div>
      </div>
    </div>
  );
}
