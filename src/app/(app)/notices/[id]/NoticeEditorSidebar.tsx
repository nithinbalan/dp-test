'use client';

/** The three sidebar cards (Jethur AI assist, Notice check, Source/RoPA) — split out
 * of `NoticeEditor.tsx` to keep that file under the line/complexity budget. */
import NextLink from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  GitCompare,
  ListChecks,
  Network,
  Sparkles,
} from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Text } from '@atoms/Text';
import type { NoticeDetail } from '@shared/hooks';
import type { NoticeCheck } from '@/app/api/notices/templates';
import type { RopaCheckResult } from './use-notice-editor-actions';
import type { NoticeEditorMessages } from './NoticeEditorMessages';

export function NoticeAiCard({
  t,
  focusedHeading,
  onAction,
}: {
  t: NoticeEditorMessages;
  focusedHeading: string | null;
  onAction: (kind: 'simplify' | 'improve' | 'rewrite' | 'translate') => void;
}) {
  const actions: { kind: 'improve' | 'simplify' | 'rewrite' | 'translate'; label: string }[] = [
    { kind: 'improve', label: t.aiImprove },
    { kind: 'simplify', label: t.aiSimplify },
    { kind: 'rewrite', label: t.aiRewrite },
    { kind: 'translate', label: t.aiTranslate },
  ];

  return (
    <div className="border-bg-inverse bg-bg-inverse-subtle text-fg-inverse rounded-2xl border p-4 shadow-xs">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="text-accent-solid size-4" />
        <Text as="span" size="sm" weight="bold" className="text-fg-inverse">
          {t.aiCardTitle}
        </Text>
      </div>
      <p className="text-fg-inverse-subtle mb-3 text-xs leading-relaxed">
        {focusedHeading
          ? t.aiCardHintWorking.replace('{section}', focusedHeading)
          : t.aiCardHintDefault}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <button
            key={a.kind}
            type="button"
            onClick={() => {
              onAction(a.kind);
            }}
            className="text-fg-inverse hover:border-accent-solid flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 text-xs font-medium transition-colors hover:bg-white/20"
          >
            <Sparkles className="text-accent-solid size-3.5" />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NoticeCheckCard({
  t,
  result,
  isChecking,
  onRunCheck,
  onFixPlaceholders,
}: {
  t: NoticeEditorMessages;
  result: NoticeCheck | null;
  isChecking: boolean;
  onRunCheck: () => void;
  onFixPlaceholders: () => void;
}) {
  return (
    <Card variant="outline" className="flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <ListChecks className="text-brand-fg size-4" />
        <Text as="span" size="sm" weight="bold">
          {t.checkCardTitle}
        </Text>
      </div>
      <p className="text-fg-muted text-xs leading-relaxed">{t.checkCardDescription}</p>

      <Button
        variant="outline"
        size="sm"
        isDisabled={isChecking}
        onClick={onRunCheck}
        className="w-full"
      >
        {isChecking ? t.checkingLabel : t.checkCta}
      </Button>

      {result && (
        <div className="mt-2 flex flex-col gap-2">
          {result.items.map((item) => (
            <div key={item.messageKey} className="flex items-start gap-2 text-xs leading-snug">
              {item.status === 'ok' ? (
                <CheckCircle2 className="text-success-fg mt-0.5 size-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="text-warning-fg mt-0.5 size-3.5 shrink-0" />
              )}
              <span
                className={item.status === 'warn' ? 'text-warning-fg font-medium' : 'text-fg-muted'}
              >
                {t[item.messageKey as keyof NoticeEditorMessages] || item.messageKey}
              </span>
            </div>
          ))}

          {result.hasPlaceholders && (
            <Button
              tone="brand"
              size="sm"
              startSlot={<Sparkles className="size-3.5" />}
              onClick={onFixPlaceholders}
              className="mt-2 w-full"
            >
              {t.aiFix}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function SourcePill({ label }: { label: string }) {
  return (
    <span className="bg-brand-subtle text-2xs text-brand-fg rounded-full px-2 py-0.5 font-mono">
      {label}
    </span>
  );
}

function RopaCheckList({ results }: { results: readonly RopaCheckResult[] }) {
  return (
    <div className="mt-1 flex flex-col gap-2">
      {results.map((item) => (
        <div key={item.message} className="flex items-start gap-2 text-xs leading-snug">
          {item.status === 'ok' ? (
            <CheckCircle2 className="text-success-fg mt-0.5 size-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="text-warning-fg mt-0.5 size-3.5 shrink-0" />
          )}
          <span
            className={item.status === 'warn' ? 'text-warning-fg font-medium' : 'text-fg-muted'}
          >
            {item.message}
          </span>
        </div>
      ))}
    </div>
  );
}

function LinkedSourceContent({
  t,
  notice,
  isRopaChecking,
  ropaCheckResult,
  onCheckRopa,
  onFixRopa,
}: {
  t: NoticeEditorMessages;
  notice: NoticeDetail;
  isRopaChecking: boolean;
  ropaCheckResult: readonly RopaCheckResult[] | null;
  onCheckRopa: () => void;
  onFixRopa: () => void;
}) {
  const pills = [
    t.ropaSummaryPurpose,
    t.ropaSummaryData,
    t.ropaSummaryPrincipal,
    t.ropaSummaryRecipients,
    t.ropaSummaryRetention,
    t.ropaSummaryContact,
  ];

  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <Text as="p" size="xs" weight="bold">
          {notice.activityName ?? t.defaultActivityName}
        </Text>
        <Text as="p" size="2xs" tone="muted" isMono>
          {notice.activityRef} {t.sourceRopaUsed}
        </Text>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {pills.map((pill) => (
          <SourcePill key={pill} label={pill} />
        ))}
      </div>

      <Button asChild variant="outline" size="sm" className="w-full">
        <NextLink href="/ropa">
          <ExternalLink className="me-1.5 size-3.5" />
          {t.viewRopaCta}
        </NextLink>
      </Button>

      <Button
        variant="outline"
        size="sm"
        startSlot={<GitCompare className="size-3.5" />}
        isDisabled={isRopaChecking}
        onClick={onCheckRopa}
        className="w-full"
      >
        {isRopaChecking ? t.comparingLabel : t.checkAgainstRopaCta}
      </Button>

      {ropaCheckResult && (
        <>
          <RopaCheckList results={ropaCheckResult} />
          {ropaCheckResult.some((r) => r.status === 'warn') && (
            <Button
              tone="brand"
              size="sm"
              startSlot={<Sparkles className="size-3.5" />}
              onClick={onFixRopa}
              className="mt-1 w-full"
            >
              {t.fixWithRopaCta}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

export function NoticeSourceCard({
  t,
  notice,
  isRopaChecking,
  ropaCheckResult,
  onCheckRopa,
  onFixRopa,
}: {
  t: NoticeEditorMessages;
  notice: NoticeDetail;
  isRopaChecking: boolean;
  ropaCheckResult: readonly RopaCheckResult[] | null;
  onCheckRopa: () => void;
  onFixRopa: () => void;
}) {
  return (
    <Card variant="outline" className="flex flex-col gap-3 rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <Network className="text-brand-fg size-4" />
        <Text as="span" size="sm" weight="bold">
          {notice.activityRef ? t.sourceCardGeneratedTitle : t.sourceCardTitle}
        </Text>
      </div>

      {notice.activityRef ? (
        <LinkedSourceContent
          t={t}
          notice={notice}
          isRopaChecking={isRopaChecking}
          ropaCheckResult={ropaCheckResult}
          onCheckRopa={onCheckRopa}
          onFixRopa={onFixRopa}
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-fg-muted text-xs leading-relaxed">{t.sourceFromScratchHint}</p>
          <Button asChild variant="outline" size="sm" className="w-full">
            <NextLink href="/ropa">
              <ExternalLink className="me-1.5 size-3.5" />
              {t.openRopaCta}
            </NextLink>
          </Button>
        </div>
      )}
    </Card>
  );
}
