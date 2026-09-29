'use client';

/**
 * Header row + stat chips for the RoPA activity detail view.
 * Prototype source: `.sd-head` / `.rpd-chips` in app.html's rpdetail template.
 */
import NextLink from 'next/link';
import { ArrowLeft, Check, Pencil } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { PageHeader } from '@molecules/PageHeader';
import { StatCard } from '@molecules/StatCard';
import type { ActivityDetail, ActivityStatus } from '@shared/hooks';
import type { ActivityDetailMessages } from './ActivityDetailView.types';

const STATUS_TONES = {
  approved: 'success',
  'needs-review': 'warning',
  'ai-draft': 'accent',
} as const;

export function statusLabel(t: ActivityDetailMessages, status: ActivityStatus): string {
  if (status === 'approved') return t.statusApproved;
  if (status === 'needs-review') return t.statusNeedsReview;
  return t.statusAiDraft;
}

export function DetailHeader({
  t,
  activity,
  status,
  onApprove,
}: {
  t: ActivityDetailMessages;
  activity: ActivityDetail;
  status: ActivityStatus;
  onApprove: () => void;
}) {
  const isApproved = status === 'approved';
  return (
    <>
      <Button asChild variant="ghost" size="md" className="w-fit">
        <NextLink href="/ropa" className="flex items-center gap-1.5">
          <ArrowLeft className="size-4" />
          {t.backCta}
        </NextLink>
      </Button>

      <PageHeader
        refTag={`${activity.refCode} · ${t.refLabel} · v${String(activity.version)}`}
        label={activity.name}
        actionSlot={
          <>
            {!isApproved && (
              <Button
                variant="outline"
                tone="brand"
                size="md"
                startSlot={<Check className="size-4" />}
                onClick={onApprove}
              >
                {t.actionApprove}
              </Button>
            )}
            <Button
              asChild
              variant="solid"
              tone="brand"
              size="md"
              startSlot={<Pencil className="size-4" />}
            >
              <NextLink href={`/ropa/${activity.id}/edit`}>{t.actionEdit}</NextLink>
            </Button>
          </>
        }
      />

      <div className="-mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_TONES[status]}>{statusLabel(t, status)}</Badge>
        <Badge variant="soft" tone="neutral">
          {activity.principals}
        </Badge>
        <Badge variant="soft" tone="neutral">
          {t.ownerPrefix} · {activity.ownerName.toUpperCase()}
        </Badge>
      </div>
    </>
  );
}

export function DetailStats({
  t,
  activity,
}: {
  t: ActivityDetailMessages;
  activity: ActivityDetail;
}) {
  const hasConfidence = activity.confidence !== undefined;
  return (
    <div className="flex flex-wrap gap-2">
      <StatCard
        label={hasConfidence ? t.chipConfidence : t.chipSourceLabel}
        value={hasConfidence ? `${String(activity.confidence)}%` : t.chipSourceManual}
        size="xs"
      />
      <StatCard label={t.chipEvidenceSources} value={activity.evidence.length} size="xs" />
      <StatCard label={t.chipLastReviewed} value={activity.reviewedAt ?? '—'} size="xs" />
      <StatCard label={t.chipProcessors} value={activity.processors.length} size="xs" />
    </div>
  );
}
