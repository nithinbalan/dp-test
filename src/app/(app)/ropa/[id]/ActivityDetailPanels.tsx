'use client';

/**
 * Left column of the RoPA activity detail view — the full record panel and the
 * "why did Jethur create this" AI-rationale disclosure.
 * Prototype source: `.wz-panel` / `.rpa-adv` in app.html's rpdetail template.
 */
import { useState, type ReactNode } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Text } from '@atoms/Text';
import { cn } from '@shared/lib';
import { useToast, type ActivityDetail } from '@shared/hooks';
import { IDENTIFIER_LABELS } from '@shared/mock/data-map';
import type { ActivityDetailMessages } from './ActivityDetailView.types';

const IDENTIFIER_LABELS_BY_KEY: Record<string, string | undefined> = IDENTIFIER_LABELS;

// ---------------------------------------------------------------------------
// A single label/value row — matches prototype .rv2
// ---------------------------------------------------------------------------
export function DetailRow({
  label,
  value,
  isUnknown,
  t,
}: {
  label: string;
  value: string;
  isUnknown?: boolean;
  t?: ActivityDetailMessages;
}) {
  const toast = useToast();
  return (
    <div className="border-border-default/50 flex items-baseline gap-3 border-b py-2 text-sm last:border-b-0">
      <Text as="span" size="xs" tone="muted" className="w-40 shrink-0">
        {label}
      </Text>
      {isUnknown && t ? (
        <span className="flex items-center gap-2">
          <Text as="span" size="sm" weight="bold" tone="danger">
            {t.unknown}
          </Text>
          <Button
            variant="ghost"
            tone="brand"
            size="xs"
            onClick={() => {
              toast.show({ label: t.resolveToast, tone: 'info' });
            }}
          >
            {t.resolveCta}
          </Button>
        </span>
      ) : (
        <Text as="span" size="sm" weight="medium">
          {value}
        </Text>
      )}
    </div>
  );
}

export function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: ReactNode;
}) {
  return (
    <Card variant="outline" size="md">
      <div className="mb-2 flex flex-col gap-0.5">
        <Text size="sm" weight="semibold">
          {title}
        </Text>
        {sub && (
          <Text size="xs" tone="muted">
            {sub}
          </Text>
        )}
      </div>
      {children}
    </Card>
  );
}

export function FullRecordPanel({
  t,
  activity,
}: {
  t: ActivityDetailMessages;
  activity: ActivityDetail;
}) {
  return (
    <Panel title={t.fullRecordTitle} sub={t.fullRecordSub}>
      <DetailRow label={t.rowActivity} value={activity.name} />
      <DetailRow label={t.rowPurpose} value={activity.purpose} />
      <DetailRow label={t.rowSubjects} value={activity.principals} />
      <DetailRow
        label={t.rowPersonalData}
        value={activity.dataCategories
          .map((key) => IDENTIFIER_LABELS_BY_KEY[key] ?? key)
          .join(', ')}
      />
      <DetailRow label={t.rowSource} value={activity.dataSource} />
      <DetailRow label={t.rowOperations} value={activity.operations.join(', ')} />
      <DetailRow label={t.rowSystems} value={activity.systems.join(', ')} />
      <DetailRow label={t.rowStorage} value={activity.storageLocation} />
      <DetailRow
        label={t.rowProcessors}
        value={activity.processors.length ? activity.processors.join(', ') : t.none}
      />
      <DetailRow
        label={t.rowRecipients}
        value={activity.recipients.length ? activity.recipients.join(', ') : t.noneRecorded}
      />
      <DetailRow label={t.rowCrossBorder} value={activity.crossBorder} />
      <DetailRow label={t.rowLawfulBasis} value={activity.basisLabel} />
      <DetailRow
        label={t.rowRetention}
        value={activity.retention}
        isUnknown={activity.retentionUnknown}
        t={t}
      />
      <DetailRow label={t.rowSecurity} value={activity.security.join(', ')} />
      <DetailRow label={t.rowOwner} value={activity.ownerName} />
    </Panel>
  );
}

/** Collapsed by default — matches prototype's `.rpa-adv` (closed unless toggled). */
export function AiRationalePanel({
  t,
  evidence,
  rationale,
  confidence,
}: {
  t: ActivityDetailMessages;
  evidence: string[];
  rationale: string;
  confidence: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-border-default rounded-control mt-3.5 border">
      <button
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        aria-expanded={isOpen}
        className="text-fg-muted flex w-full items-center gap-2 px-3.5 py-2.5 text-start"
      >
        <Sparkles className="size-4 shrink-0" aria-hidden />
        <Text as="span" size="xs" weight="medium" className="flex-1">
          {t.whyTitle}
        </Text>
        <ChevronDown
          className={cn('size-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
          aria-hidden
        />
      </button>
      {isOpen && (
        <div className="border-border-default border-t px-3.5 py-1.5">
          <DetailRow label={t.whySignals} value={evidence.join(' · ')} />
          <DetailRow label={t.whyInference} value={rationale} />
          <DetailRow label={t.whyConfidence} value={`${String(confidence)}%`} />
        </div>
      )}
    </div>
  );
}
