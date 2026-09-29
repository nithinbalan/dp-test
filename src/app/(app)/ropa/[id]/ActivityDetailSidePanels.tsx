'use client';

/**
 * Right column of the RoPA activity detail view — evidence, approval record,
 * change history, and post-approval monitoring.
 * Prototype source: the second `.wz-panel` column in app.html's rpdetail template.
 */
import type { ReactNode } from 'react';
import { Database, User } from 'lucide-react';
import { Text } from '@atoms/Text';
import type { ActivityHistoryEntry, ActivityStatus } from '@shared/hooks';
import { statusLabel } from './ActivityDetailHeader';
import { DetailRow, Panel } from './ActivityDetailPanels';
import type { ActivityDetailMessages } from './ActivityDetailView.types';

function EvidenceItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="border-border-default/50 flex items-center gap-2 border-b py-1.5 last:border-b-0">
      <span aria-hidden className="text-brand-fg shrink-0">
        {icon}
      </span>
      <Text as="span" size="sm">
        {children}
      </Text>
    </div>
  );
}

function EvidencePanel({ t, evidence }: { t: ActivityDetailMessages; evidence: string[] }) {
  return (
    <Panel title={t.evidenceTitle} sub={t.evidenceSub}>
      <div className="flex flex-col">
        {evidence.length === 0 ? (
          <EvidenceItem icon={<User className="size-3.5" />}>{t.evidenceEmpty}</EvidenceItem>
        ) : (
          evidence.map((item) => (
            <EvidenceItem key={item} icon={<Database className="size-3.5" />}>
              {item}
            </EvidenceItem>
          ))
        )}
      </div>
    </Panel>
  );
}

function ApprovalPanel({
  t,
  status,
  reviewer,
  reviewedAt,
  version,
}: {
  t: ActivityDetailMessages;
  status: ActivityStatus;
  reviewer: string | undefined;
  reviewedAt: string | undefined;
  version: number;
}) {
  return (
    <Panel title={t.approvalTitle} sub={t.approvalSub}>
      <DetailRow label={t.approvalStatusLabel} value={statusLabel(t, status)} />
      <DetailRow label={t.approvalReviewer} value={reviewer ?? t.approvalReviewerPending} />
      <DetailRow label={t.approvalDate} value={reviewedAt ?? '—'} />
      <DetailRow label={t.approvalVersion} value={`v${String(version)}`} />
      <DetailRow label={t.approvalSnapshot} value={t.approvalSnapshotValue} />
    </Panel>
  );
}

function HistoryPanel({
  t,
  history,
}: {
  t: ActivityDetailMessages;
  history: ActivityHistoryEntry[];
}) {
  return (
    <Panel title={t.historyTitle}>
      {history.length === 0 ? (
        <Text size="sm" weight="medium">
          {t.historyEmpty}
        </Text>
      ) : (
        history.map((entry) => (
          <div
            key={entry.label}
            className="border-border-default/50 flex items-baseline gap-3 border-b py-2 last:border-b-0"
          >
            <Text as="span" size="2xs" isMono tone="muted" className="w-24 shrink-0">
              {entry.date}
            </Text>
            <Text as="span" size="sm" weight="medium">
              {entry.label}
            </Text>
          </div>
        ))
      )}
    </Panel>
  );
}

function MonitoringPanel({ t }: { t: ActivityDetailMessages }) {
  return (
    <Panel title={t.monitoringTitle}>
      <DetailRow label={t.monitoringWatching} value={t.monitoringWatchingValue} />
      <DetailRow label={t.monitoringOnChange} value={t.monitoringOnChangeValue} />
    </Panel>
  );
}

export function DetailSidePanels({
  t,
  activity,
  status,
  reviewer,
  history,
}: {
  t: ActivityDetailMessages;
  activity: { evidence: string[]; reviewedAt: string | undefined; version: number };
  status: ActivityStatus;
  reviewer: string | undefined;
  history: ActivityHistoryEntry[];
}) {
  return (
    <div className="flex flex-col gap-4 lg:col-span-2">
      <EvidencePanel t={t} evidence={activity.evidence} />
      <ApprovalPanel
        t={t}
        status={status}
        reviewer={reviewer}
        reviewedAt={activity.reviewedAt}
        version={activity.version}
      />
      <HistoryPanel t={t} history={history} />
      <MonitoringPanel t={t} />
    </div>
  );
}
