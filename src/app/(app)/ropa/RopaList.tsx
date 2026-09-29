'use client';

/**
 * Owns search/filter/quick-draft state for the populated RoPA view.
 * Prototype source: data-page="ropa" in app.html.
 */
import { useMemo, useState } from 'react';
import NextLink from 'next/link';
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  HelpCircle,
  Plus,
  Scale,
  Search,
  Sparkles,
  SquareCheckBig,
  UserCheck,
  Users,
} from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Divider } from '@atoms/Divider';
import { Input } from '@atoms/Input';
import { Select, type SelectOption } from '@atoms/Select';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { StatCard } from '@molecules/StatCard';
import { Dialog } from '@organisms/Dialog';
import { useActivities, useApproveActivity, useToast } from '@shared/hooks';
import type { RopaMessages } from './RopaMessages';
import { ActivitiesTable, ActivitiesTableSkeleton, type ActivityRow } from './RopaTable';

// ---------------------------------------------------------------------------
// Quick-draft inline bar (used in both empty state and populated toolbar)
// ---------------------------------------------------------------------------
function QuickDraft({ t }: { t: RopaMessages }) {
  const [seed, setSeed] = useState('');
  const toast = useToast();
  return (
    <Card variant="outline" size="sm" className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          value={seed}
          onChange={(event) => {
            setSeed(event.target.value);
          }}
          placeholder={t.quickDraftPlaceholder}
          startSlot={<Sparkles className="size-4" />}
          fullWidth
        />
        <Button
          tone="brand"
          variant="solid"
          isDisabled={seed === ''}
          onClick={() => {
            toast.show({ label: t.toastDraftedWithAi.replace('{name}', seed), tone: 'success' });
            setSeed('');
          }}
        >
          {t.quickDraftCta}
        </Button>
      </div>
      <Text size="xs" tone="muted">
        {t.quickDraftHint}
      </Text>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty state — matches prototype #rpEmpty block
// ---------------------------------------------------------------------------
function emptyDescriptionFor(t: RopaMessages, datasetCount: number, sourceCount: number): string {
  if (datasetCount === 0) return t.emptyDescriptionNoEvidence;
  return t.emptyDescriptionWithEvidence
    .replace('{datasets}', String(datasetCount))
    .replace('{datasetsPlural}', datasetCount === 1 ? '' : 's')
    .replace('{sources}', String(sourceCount))
    .replace('{sourcesPlural}', sourceCount === 1 ? '' : 's');
}

function RopaEmptyState({
  t,
  datasetCount,
  sourceCount,
}: {
  t: RopaMessages;
  datasetCount: number;
  sourceCount: number;
}) {
  return (
    <EmptyState
      label={t.emptyTitle}
      description={emptyDescriptionFor(t, datasetCount, sourceCount)}
      tone="brand"
      startSlot={<Sparkles className="size-8" />}
      actionSlot={
        <Button asChild tone="brand" variant="solid" startSlot={<Sparkles className="size-4" />}>
          <NextLink href="/ropa/generate">{t.cta}</NextLink>
        </Button>
      }
    >
      {/* Quick-draft alternative */}
      <div className="mt-4 flex w-full max-w-lg flex-col gap-3">
        <Divider>{t.emptyOrLabel}</Divider>
        <QuickDraft t={t} />
        <div className="flex justify-center">
          <Button
            asChild
            variant="ghost"
            tone="brand"
            size="sm"
            startSlot={<Plus className="size-3.5" />}
          >
            <NextLink href="/ropa/add">{t.tertiaryCta}</NextLink>
          </Button>
        </div>
      </div>
      {/* Prototype hint line */}
      <Text as="span" size="2xs" tone="subtle" isMono className="mt-4 tracking-widest uppercase">
        {t.emptyHintLine}
      </Text>
    </EmptyState>
  );
}

// ---------------------------------------------------------------------------
// Info modal — matches prototype #rpInfoOverlay / cn-modal block
// ---------------------------------------------------------------------------
function InfoModalStepsPanel({ t }: { t: RopaMessages }) {
  return (
    <div className="border-border-default rounded-control border p-4">
      <div className="mb-3 flex flex-col gap-0.5">
        <Text weight="semibold">{t.infoModalPanelTitle}</Text>
        <Text size="xs" tone="muted">
          {t.infoModalPanelSub}
        </Text>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            [t.infoModalStep1, t.infoModalStep1Body],
            [t.infoModalStep2, t.infoModalStep2Body],
            [t.infoModalStep3, t.infoModalStep3Body],
          ] as const
        ).map(([title, body]) => (
          <div key={title} className="bg-bg-subtle rounded-control p-3">
            <Text size="xs" weight="semibold" className="mb-1">
              {title}
            </Text>
            <Text size="xs" tone="muted">
              {body}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoModalMonitorPanel({ t }: { t: RopaMessages }) {
  return (
    <div className="border-border-default rounded-control border p-4">
      <div className="mb-3 flex flex-col gap-0.5">
        <Text weight="semibold">{t.infoModalMonitorTitle}</Text>
        <Text size="xs" tone="muted">
          {t.infoModalMonitorSub}
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        {(
          [
            [t.infoModalTrigger1Cause, t.infoModalTrigger1Effect],
            [t.infoModalTrigger2Cause, t.infoModalTrigger2Effect],
            [t.infoModalTrigger3Cause, t.infoModalTrigger3Effect],
          ] as const
        ).map(([cause, effect]) => (
          <div key={cause} className="flex flex-wrap items-center gap-2 text-xs">
            <Text as="span" size="xs" tone="muted">
              {cause}
            </Text>
            <ArrowRight className="text-fg-subtle size-3.5 shrink-0" aria-hidden />
            <Text as="span" size="xs" weight="medium">
              {effect}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoModal({
  t,
  isOpen,
  onClose,
}: {
  t: RopaMessages;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      label={t.infoModalLabel}
      description={t.infoModalDescription}
      size="lg"
      closeLabel={t.closeLabel}
      testId="ropa-info-modal"
    >
      <div className="flex flex-col gap-4">
        <Badge variant="soft" tone="brand" size="sm" className="w-fit">
          {t.infoModalRefTag}
        </Badge>
        <InfoModalStepsPanel t={t} />
        <InfoModalMonitorPanel t={t} />
      </div>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Stats bar — 4 compact StatCards matching prototype .ar-stats
// ---------------------------------------------------------------------------
function StatsBar({
  t,
  totalCount,
  approvedCount,
  needsReviewCount,
  unlinkedDatasetCount,
  isLoading = false,
}: {
  t: RopaMessages;
  totalCount?: number;
  approvedCount?: number;
  needsReviewCount?: number;
  unlinkedDatasetCount?: number;
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label={t.kpiActivities} value={totalCount} size="sm" isLoading={isLoading} />
      <StatCard
        label={t.kpiApproved}
        value={approvedCount}
        tone="success"
        size="sm"
        isLoading={isLoading}
      />
      <StatCard
        label={t.kpiNeedsReview}
        value={needsReviewCount}
        tone="warning"
        size="sm"
        isLoading={isLoading}
      />
      <StatCard
        label={t.kpiUnlinkedDatasets}
        value={unlinkedDatasetCount}
        tone={
          unlinkedDatasetCount !== undefined && unlinkedDatasetCount > 0 ? 'warning' : 'neutral'
        }
        size="sm"
        isLoading={isLoading}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter toolbar — search + 3 selects + add-activity ghost button
// ---------------------------------------------------------------------------
function FilterSelects({
  t,
  statusFilter,
  onStatusFilterChange,
  principalsFilter,
  onPrincipalsFilterChange,
  basisFilter,
  onBasisFilterChange,
  ownerFilter,
  onOwnerFilterChange,
  principalsOptions,
  basisOptions,
  ownerOptions,
}: {
  t: RopaMessages;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  principalsFilter: string;
  onPrincipalsFilterChange: (value: string) => void;
  basisFilter: string;
  onBasisFilterChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  principalsOptions: SelectOption[];
  basisOptions: SelectOption[];
  ownerOptions: SelectOption[];
}) {
  const statusOptions: SelectOption[] = [
    { value: 'all', label: t.statusAll },
    { value: 'approved', label: t.statusApproved },
    { value: 'needs-review', label: t.statusNeedsReview },
    { value: 'ai-draft', label: t.statusAiDraft },
  ];

  return (
    <>
      <Select
        options={statusOptions}
        value={statusFilter}
        onValueChange={onStatusFilterChange}
        aria-label={t.statusFilterLabel}
        startSlot={<SquareCheckBig className="size-4" />}
      />
      <Select
        options={principalsOptions}
        value={principalsFilter}
        onValueChange={onPrincipalsFilterChange}
        aria-label={t.principalsFilterLabel}
        startSlot={<Users className="size-4" />}
      />
      <Select
        options={basisOptions}
        value={basisFilter}
        onValueChange={onBasisFilterChange}
        aria-label={t.basisFilterLabel}
        startSlot={<Scale className="size-4" />}
      />
      <Select
        options={ownerOptions}
        value={ownerFilter}
        onValueChange={onOwnerFilterChange}
        aria-label={t.ownerFilterLabel}
        startSlot={<UserCheck className="size-4" />}
      />
    </>
  );
}

function FilterRow({
  t,
  query,
  onQueryChange,
  ...selectProps
}: {
  t: RopaMessages;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  principalsFilter: string;
  onPrincipalsFilterChange: (value: string) => void;
  basisFilter: string;
  onBasisFilterChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  principalsOptions: SelectOption[];
  basisOptions: SelectOption[];
  ownerOptions: SelectOption[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          placeholder={t.searchPlaceholder}
          startSlot={<Search className="size-4" />}
          className="min-w-48"
        />
        <FilterSelects t={t} {...selectProps} />
      </div>
      <Button
        asChild
        variant="outline"
        tone="brand"
        size="sm"
        startSlot={<Plus className="size-3.5" />}
        className="w-fit"
      >
        <NextLink href="/ropa/add">{t.addActivityCta}</NextLink>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer bar — matches prototype .ar-foot
// ---------------------------------------------------------------------------
function FooterBar({ t }: { t: RopaMessages }) {
  return (
    <div className="border-border-default flex flex-wrap items-center justify-between gap-2 border-t pt-3">
      <Text as="span" size="2xs" tone="subtle" isMono className="tracking-widest uppercase">
        {t.footerRef}
      </Text>
      <Text as="span" size="2xs" tone="subtle" isMono className="tracking-widest uppercase">
        {t.footerId}
      </Text>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action cluster — PageHeader actionSlot
// ---------------------------------------------------------------------------
function ActionCluster({
  t,
  hasAiDrafts,
  hasActivities,
  toast,
  onOpenInfo,
  onApproveAll,
}: {
  t: RopaMessages;
  hasAiDrafts: boolean;
  hasActivities: boolean;
  toast: ReturnType<typeof useToast>;
  onOpenInfo: () => void;
  onApproveAll: () => void;
}) {
  return (
    <>
      {hasAiDrafts && (
        <Button
          variant="outline"
          tone="brand"
          size="sm"
          startSlot={<Check className="size-4" />}
          onClick={onApproveAll}
        >
          {t.ctaApproveAll}
        </Button>
      )}
      <Button
        variant="outline"
        tone="brand"
        size="sm"
        startSlot={<HelpCircle className="size-4" />}
        onClick={onOpenInfo}
      >
        {t.ctaHowItWorks}
      </Button>
      <Button
        variant="outline"
        tone="brand"
        size="sm"
        startSlot={<Download className="size-4" />}
        onClick={() => {
          toast.show({ label: t.toastExport, tone: 'success' });
        }}
      >
        {t.ctaExport}
      </Button>
      <Button
        asChild
        variant="solid"
        tone="brand"
        size="sm"
        startSlot={<Sparkles className="size-4" />}
      >
        <NextLink href="/ropa/generate">
          {hasActivities ? t.ctaRefineRegenerate : t.ctaGenerate}
        </NextLink>
      </Button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Filter + selection state for the populated view
// ---------------------------------------------------------------------------
function useRopaFilters(activities: readonly ActivityRow[], t: RopaMessages) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [principalsFilter, setPrincipalsFilter] = useState('all');
  const [basisFilter, setBasisFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');

  const principalsOptions = useMemo<SelectOption[]>(() => {
    const unique = [...new Set(activities.map((a) => a.principals))].sort();
    return [
      { value: 'all', label: t.principalsAll },
      ...unique.map((p) => ({ value: p, label: p })),
    ];
  }, [activities, t.principalsAll]);

  const basisOptions = useMemo<SelectOption[]>(() => {
    const unique = [...new Set(activities.map((a) => a.basisLabel))].sort();
    return [{ value: 'all', label: t.basisAll }, ...unique.map((b) => ({ value: b, label: b }))];
  }, [activities, t.basisAll]);

  const ownerOptions = useMemo<SelectOption[]>(() => {
    const unique = [...new Set(activities.map((a) => a.ownerName))].sort();
    return [{ value: 'all', label: t.ownerAll }, ...unique.map((o) => ({ value: o, label: o }))];
  }, [activities, t.ownerAll]);

  const filtered = useMemo(
    () =>
      activities.filter(
        (activity) =>
          activity.name.toLowerCase().includes(query.toLowerCase()) &&
          (statusFilter === 'all' || activity.status === statusFilter) &&
          (principalsFilter === 'all' || activity.principals === principalsFilter) &&
          (basisFilter === 'all' || activity.basisLabel === basisFilter) &&
          (ownerFilter === 'all' || activity.ownerName === ownerFilter),
      ),
    [activities, query, statusFilter, principalsFilter, basisFilter, ownerFilter],
  );

  return {
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    principalsFilter,
    setPrincipalsFilter,
    basisFilter,
    setBasisFilter,
    ownerFilter,
    setOwnerFilter,
    principalsOptions,
    basisOptions,
    ownerOptions,
    filtered,
  };
}

/** Persists an approval via the real API, rather than the pure client-state
 * toggle this used to be — a reload (or another tab) now sees the same status. */
function useApproveHandler(
  rows: readonly ActivityRow[],
  t: RopaMessages,
  toast: ReturnType<typeof useToast>,
) {
  const approveMutation = useApproveActivity();

  const approveOne = (id: string) => {
    const activity = rows.find((row) => row.id === id);
    approveMutation.mutate(id, {
      onSuccess: () => {
        toast.show({
          label: t.toastApproved.replace('{name}', activity?.name ?? id),
          tone: 'success',
        });
      },
    });
  };

  const approveAll = () => {
    const pending = rows.filter((activity) => activity.status !== 'approved');
    for (const activity of pending) {
      approveMutation.mutate(activity.id);
    }
    if (pending.length > 0) {
      toast.show({ label: t.ctaApproveAll, tone: 'success' });
    }
  };

  return { approveOne, approveAll };
}

// ---------------------------------------------------------------------------
// Populated state — stats, filters, table, unlinked-dataset note
// ---------------------------------------------------------------------------
function PopulatedView({
  t,
  activities,
  approvedCount,
  needsReviewCount,
  unlinkedDatasetCount,
  filters,
  onApprove,
}: {
  t: RopaMessages;
  activities: readonly ActivityRow[];
  approvedCount: number;
  needsReviewCount: number;
  unlinkedDatasetCount: number;
  filters: ReturnType<typeof useRopaFilters>;
  onApprove: (id: string) => void;
}) {
  return (
    <>
      <StatsBar
        t={t}
        totalCount={activities.length}
        approvedCount={approvedCount}
        needsReviewCount={needsReviewCount}
        unlinkedDatasetCount={unlinkedDatasetCount}
      />

      <FilterRow
        t={t}
        query={filters.query}
        onQueryChange={filters.setQuery}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={filters.setStatusFilter}
        principalsFilter={filters.principalsFilter}
        onPrincipalsFilterChange={filters.setPrincipalsFilter}
        basisFilter={filters.basisFilter}
        onBasisFilterChange={filters.setBasisFilter}
        ownerFilter={filters.ownerFilter}
        onOwnerFilterChange={filters.setOwnerFilter}
        principalsOptions={filters.principalsOptions}
        basisOptions={filters.basisOptions}
        ownerOptions={filters.ownerOptions}
      />

      <QuickDraft t={t} />

      {filters.filtered.length === 0 ? (
        <EmptyState
          label={t.noResultsTitle}
          description={t.noResultsDescription}
          startSlot={<FileText className="size-6" />}
        />
      ) : (
        <ActivitiesTable t={t} rows={filters.filtered} onApprove={onApprove} />
      )}

      {unlinkedDatasetCount > 0 && (
        <Text size="xs" tone="muted">
          {t.kpiUnlinkedDatasets}: {unlinkedDatasetCount}
        </Text>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Root — RopaList
// ---------------------------------------------------------------------------
type RopaListProps = {
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
  unlinkedDatasetCount: number;
  datasetCount: number;
  sourceCount: number;
  t: RopaMessages;
};

/**
 * Same stats bar, filter row and table chrome `PopulatedView` renders — with
 * `isLoading`/skeleton bars instead of real values, so the page does not
 * shift shape once data arrives. The search input and "Add activity" button
 * are real (their copy is static, not data-dependent); the four filter
 * selects are skeleton bars because their OPTIONS come from the activities
 * this fetch hasn't returned yet.
 */
function RopaFilterRowSkeleton({ t }: { t: RopaMessages }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input value="" placeholder={t.searchPlaceholder} isDisabled className="min-w-48" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Button
        variant="outline"
        tone="brand"
        size="sm"
        startSlot={<Plus className="size-3.5" />}
        className="w-fit"
        isDisabled
      >
        {t.addActivityCta}
      </Button>
    </div>
  );
}

function RopaListSkeleton({ t }: { t: RopaMessages }) {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <StatsBar t={t} isLoading />
      <RopaFilterRowSkeleton t={t} />
      <ActivitiesTableSkeleton t={t} />
    </div>
  );
}

/** Skeleton placeholder for the PageHeader actionSlot during loading —
 * three skeleton bars approximate the "How it works", "Export" and "Generate"
 * buttons without knowing which of the data-dependent buttons (e.g. "Approve all")
 * will be present, preventing a layout shift when the cluster fully renders. */
function ActionClusterSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-32 rounded-lg" />
      <Skeleton className="h-8 w-24 rounded-lg" />
      <Skeleton className="h-8 w-28 rounded-lg" />
    </>
  );
}

export function RopaList({
  pageLabel,
  pageRefTag,
  pageDescription,
  unlinkedDatasetCount,
  datasetCount,
  sourceCount,
  t,
}: RopaListProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const toast = useToast();
  const { data, isLoading, isError } = useActivities();
  const rows = data ?? [];
  const filters = useRopaFilters(rows, t);
  const { approveOne, approveAll } = useApproveHandler(rows, t, toast);
  const isEmpty = rows.length === 0;
  const approvedCount = rows.filter((activity) => activity.status === 'approved').length;
  const needsReviewCount = rows.filter((activity) => activity.status === 'needs-review').length;
  const hasAiDrafts = rows.some(
    (activity) => activity.status === 'ai-draft' || activity.status === 'needs-review',
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page header with full action cluster */}
      <PageHeader
        label={pageLabel}
        refTag={pageRefTag}
        description={pageDescription}
        actionSlot={
          isLoading ? (
            <ActionClusterSkeleton />
          ) : (
            <ActionCluster
              t={t}
              hasAiDrafts={hasAiDrafts}
              hasActivities={!isEmpty}
              toast={toast}
              onOpenInfo={() => {
                setIsInfoOpen(true);
              }}
              onApproveAll={approveAll}
            />
          )
        }
      />

      {/* Info modal */}
      <InfoModal
        t={t}
        isOpen={isInfoOpen}
        onClose={() => {
          setIsInfoOpen(false);
        }}
      />

      {isLoading && <RopaListSkeleton t={t} />}

      {!isLoading && isError && (
        <EmptyState label={t.noResultsTitle} description={t.noResultsDescription} tone="danger" />
      )}

      {!isLoading &&
        !isError &&
        (isEmpty ? (
          /* ── Empty state ─────────────────────────────────────────────── */
          <RopaEmptyState t={t} datasetCount={datasetCount} sourceCount={sourceCount} />
        ) : (
          /* ── Populated state ─────────────────────────────────────────── */
          <PopulatedView
            t={t}
            activities={rows}
            approvedCount={approvedCount}
            needsReviewCount={needsReviewCount}
            unlinkedDatasetCount={unlinkedDatasetCount}
            filters={filters}
            onApprove={approveOne}
          />
        ))}

      {/* Footer bar */}
      <FooterBar t={t} />
    </div>
  );
}
