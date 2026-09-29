'use client';

/**
 * Owns local approve/resolve interaction state for the RoPA activity detail view.
 * Prototype source: data-page="rpdetail" / rpOpenDetail() in app.html.
 */
import { useState } from 'react';
import { notFound } from 'next/navigation';
import { EmptyState } from '@molecules/EmptyState';
import { useActivity, useApproveActivity, useToast, type ActivityDetail } from '@shared/hooks';
import { ActivityDetailSkeleton } from './ActivityDetailSkeleton';
import { DetailHeader, DetailStats } from './ActivityDetailHeader';
import { AiRationalePanel, FullRecordPanel } from './ActivityDetailPanels';
import { DetailSidePanels } from './ActivityDetailSidePanels';
import type { ActivityDetailMessages } from './ActivityDetailView.types';

/** Owns the local optimistic approve view (status/reviewer/history badge) while the
 * real approval persists in the background via the mutation. */
function useApprovalState(activity: ActivityDetail, t: ActivityDetailMessages) {
  const toast = useToast();
  const approveMutation = useApproveActivity();
  const [status, setStatus] = useState(activity.status);
  const [history, setHistory] = useState(activity.history);
  const [reviewer, setReviewer] = useState(activity.reviewer);

  function approve() {
    approveMutation.mutate(activity.id, {
      onSuccess: () => {
        setStatus('approved');
        setReviewer(activity.ownerName);
        setHistory((current) => [
          {
            label: t.historyApprovedTemplate.replace('{name}', activity.ownerName),
            date: t.justNowLabel,
          },
          ...current,
        ]);
        toast.show({ label: t.toastApproved.replace('{name}', activity.name), tone: 'success' });
      },
    });
  }

  return { status, history, reviewer, approve };
}

function ActivityDetailContent({
  activity,
  t,
}: {
  activity: ActivityDetail;
  t: ActivityDetailMessages;
}) {
  const { status, history, reviewer, approve } = useApprovalState(activity, t);

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader t={t} activity={activity} status={status} onApprove={approve} />
      <DetailStats t={t} activity={activity} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-start">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <FullRecordPanel t={t} activity={activity} />
          {activity.aiRationale !== undefined && activity.confidence !== undefined && (
            <AiRationalePanel
              t={t}
              evidence={activity.evidence}
              rationale={activity.aiRationale}
              confidence={activity.confidence}
            />
          )}
        </div>
        <DetailSidePanels
          t={t}
          activity={activity}
          status={status}
          reviewer={reviewer}
          history={history}
        />
      </div>
    </div>
  );
}

export function ActivityDetailView({ id, t }: { id: string; t: ActivityDetailMessages }) {
  const { data, isLoading, isError } = useActivity(id);

  if (isLoading) return <ActivityDetailSkeleton t={t} />;
  if (isError) {
    return (
      <EmptyState label={t.loadErrorTitle} description={t.loadErrorDescription} tone="danger" />
    );
  }
  if (!data) notFound();

  return <ActivityDetailContent activity={data} t={t} />;
}
