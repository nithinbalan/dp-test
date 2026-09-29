'use client';

/**
 * Notice Editor matching the prototype's rich editor layout, sticky formatting toolbar,
 * per-section controls, Jethur AI assistant card, 7-point Notice Check with instant fix,
 * and RoPA drift comparison & realignment.
 *
 * The state/handlers live in `use-notice-editor-docs.ts` and `use-notice-editor-actions.ts`,
 * and the header/toolbar/section-list/sidebar each have their own file — this file only
 * wires them together, which is what keeps it under the max-lines-per-function budget.
 */
import { useState } from 'react';
import NextLink from 'next/link';
import { CloudUpload, Plus, Save, Share2 } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Select, type SelectOption } from '@atoms/Select';
import { Skeleton } from '@atoms/Skeleton';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { ApiError } from '@shared/lib/api-client';
import { formatDate } from '@shared/lib';
import { useNotice, type NoticeDetail } from '@shared/hooks';
import { NT_L8 } from '@/app/api/notices/templates';
import { AddTranslationModal } from '../components/AddTranslationModal';
import { ShareNoticeModal } from '../components/ShareNoticeModal';
import { useNoticeEditorDocs } from './use-notice-editor-docs';
import {
  useNoticeEditorAi,
  useNoticeEditorRopa,
  useNoticeEditorSave,
} from './use-notice-editor-actions';
import { NoticeEditorToolbar } from './NoticeEditorToolbar';
import { NoticeSectionList } from './NoticeSectionList';
import { NoticeAiCard, NoticeCheckCard, NoticeSourceCard } from './NoticeEditorSidebar';
import { useNoticeEditorFormatting } from './use-notice-editor-formatting';
import type { NoticeEditorMessages } from './NoticeEditorMessages';

function EditorHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-28 rounded-lg" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-72 flex-1 flex-col gap-2">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-4 w-56 rounded" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function DocumentPanelSkeleton() {
  return (
    <div className="border-border-default bg-bg-surface relative rounded-2xl border p-6 shadow-xs sm:p-8">
      <div className="border-border-default bg-bg-surface/90 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32 rounded" />
          <div className="bg-border-default mx-1 h-4 w-px" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} className="size-7 rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="size-7 rounded-md" />
          ))}
        </div>
      </div>

      <div className="border-border-default mb-6 border-b pb-4">
        <Skeleton className="h-7 w-48 rounded" />
        <Skeleton className="mt-2 h-3.5 w-64 rounded" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="border-border-subtle rounded-xl border p-3.5">
          <Skeleton className="mb-3 h-5 w-36 rounded" />
          <Skeleton lines={3} className="w-full" />
        </div>

        <div className="border-border-subtle rounded-xl border p-3.5">
          <Skeleton className="mb-3 h-5 w-52 rounded" />
          <Skeleton lines={2} className="mb-3 w-full" />
          <div className="space-y-2 ps-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        </div>

        <div className="border-border-subtle rounded-xl border p-3.5">
          <Skeleton className="mb-3 h-5 w-44 rounded" />
          <Skeleton lines={3} className="w-full" />
        </div>
      </div>
    </div>
  );
}

function EditorSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="border-bg-inverse bg-bg-inverse-subtle rounded-2xl border p-4 shadow-xs">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="size-4 rounded-full bg-white/20" />
          <Skeleton className="h-4 w-24 rounded bg-white/20" />
        </div>
        <Skeleton className="mb-3 h-3 w-52 rounded bg-white/20" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-8 rounded-lg bg-white/10" />
          ))}
        </div>
      </div>

      <Card variant="outline" className="flex flex-col gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-md" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <Skeleton lines={2} className="w-full" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </Card>

      <Card variant="outline" className="flex flex-col gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-md" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <Skeleton lines={2} className="w-full" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </Card>
    </div>
  );
}

function EditorLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <EditorHeaderSkeleton />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_310px]">
        <DocumentPanelSkeleton />
        <EditorSidebarSkeleton />
      </div>
    </div>
  );
}

function EditorHeaderTop({
  t,
  notice,
  name,
  onNameChange,
  onOpenShare,
}: {
  t: NoticeEditorMessages;
  notice: NoticeDetail;
  name: string;
  onNameChange: (value: string) => void;
  onOpenShare: () => void;
}) {
  const metaLine = t.noticeMetaLine
    .replace('{ref}', notice.refCode)
    .replace('{version}', notice.version || '1.0')
    .replace('{date}', formatDate(notice.updatedAt));

  return (
    <div className="flex min-w-72 flex-1 flex-col gap-1.5">
      <input
        type="text"
        value={name}
        onChange={(e) => {
          onNameChange(e.target.value);
        }}
        placeholder={t.namePlaceholder}
        aria-label={t.namePlaceholder}
        className="text-fg-default hover:border-border-default focus:border-brand-solid focus:bg-bg-surface w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-2xl font-bold tracking-tight transition-colors focus:outline-none"
      />
      <div className="text-fg-muted flex flex-wrap items-center gap-2.5 font-mono text-xs">
        <span>{metaLine}</span>
        <span
          className={
            notice.status === 'published'
              ? 'bg-success-subtle text-2xs text-success-fg rounded-full px-2 py-0.5 font-semibold tracking-wider uppercase'
              : 'bg-warning-subtle text-2xs text-warning-fg rounded-full px-2 py-0.5 font-semibold tracking-wider uppercase'
          }
        >
          {notice.status}
        </span>
        {notice.status === 'published' && (
          <button
            type="button"
            onClick={onOpenShare}
            className="text-brand-fg inline-flex items-center gap-1 font-sans text-xs font-semibold hover:underline"
          >
            <Share2 className="size-3" />
            {t.shareEmbedLink}
          </button>
        )}
      </div>
    </div>
  );
}

function LanguageSelect({
  t,
  currentLang,
  langs,
  onChange,
}: {
  t: NoticeEditorMessages;
  currentLang: string;
  langs: readonly string[];
  onChange: (value: string) => void;
}) {
  const options: SelectOption[] = langs.map((l) => {
    const info = NT_L8.find((item) => item.en === l);
    return { value: l, label: info ? `${info.en} · ${info.nat}` : l };
  });

  return (
    <Select
      options={options}
      value={currentLang}
      onValueChange={onChange}
      aria-label={t.languageSelectLabel}
      size="sm"
    />
  );
}

function EditorHeader({
  t,
  notice,
  docsState,
  onOpenShare,
  onOpenTranslation,
  onSave,
  onPublish,
  isSaving,
  isPublishing,
}: {
  t: NoticeEditorMessages;
  notice: NoticeDetail;
  docsState: ReturnType<typeof useNoticeEditorDocs>;
  onOpenShare: () => void;
  onOpenTranslation: () => void;
  onSave: () => void;
  onPublish: () => void;
  isSaving: boolean;
  isPublishing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Button asChild variant="ghost" size="sm" className="self-start">
        <NextLink href="/notices">{t.backToNotices}</NextLink>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <EditorHeaderTop
          t={t}
          notice={notice}
          name={docsState.name}
          onNameChange={docsState.setName}
          onOpenShare={onOpenShare}
        />

        <div className="flex flex-wrap items-center gap-2">
          <LanguageSelect
            t={t}
            currentLang={docsState.currentLang}
            langs={docsState.langs}
            onChange={docsState.setCurrentLang}
          />
          <Button
            variant="outline"
            size="sm"
            startSlot={<Plus className="size-3.5" />}
            onClick={onOpenTranslation}
          >
            {t.addTranslationCta}
          </Button>
          <Button
            variant="outline"
            size="sm"
            startSlot={<Save className="size-3.5" />}
            isDisabled={isSaving}
            onClick={onSave}
          >
            {t.saveDraftCta}
          </Button>
          <Button
            tone="brand"
            size="sm"
            startSlot={<CloudUpload className="size-3.5" />}
            isDisabled={isPublishing}
            onClick={onPublish}
          >
            {notice.status === 'published' ? t.publishUpdateCta : t.publishCta}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DocumentPanel({
  t,
  notice,
  docsState,
  onFormat,
}: {
  t: NoticeEditorMessages;
  notice: NoticeDetail;
  docsState: ReturnType<typeof useNoticeEditorDocs>;
  onFormat: (cmd: string) => void;
}) {
  const docHeaderMeta = t.docHeaderMeta
    .replace('{date}', formatDate(notice.updatedAt))
    .replace('{version}', notice.version || '1.0')
    .replace('{language}', docsState.currentLang.toUpperCase());

  return (
    <div className="border-border-default bg-bg-surface relative rounded-2xl border p-6 shadow-xs sm:p-8">
      <NoticeEditorToolbar
        t={t}
        focusedHeading={docsState.focusedSec?.heading ?? null}
        focusIndex={docsState.focusIndex}
        sectionCount={docsState.currentSections.length}
        onFormat={onFormat}
        onMoveUp={() => {
          if (docsState.focusIndex !== null) docsState.handleMoveSection(docsState.focusIndex, -1);
        }}
        onMoveDown={() => {
          if (docsState.focusIndex !== null) docsState.handleMoveSection(docsState.focusIndex, 1);
        }}
        onDelete={() => {
          if (docsState.focusIndex !== null) docsState.handleDeleteSection(docsState.focusIndex);
        }}
      />

      <div className="border-border-default mb-6 border-b pb-4">
        <Text size="lg" weight="bold">
          {docsState.currentDoc.name || docsState.name}
        </Text>
        <Text as="p" size="xs" tone="muted" isMono className="mt-1">
          {docHeaderMeta}
        </Text>
      </div>

      <NoticeSectionList
        t={t}
        currentLang={docsState.currentLang}
        sections={docsState.currentSections}
        focusIndex={docsState.focusIndex}
        onFocus={docsState.setFocusIndex}
        onHeadingChange={docsState.handleHeadingChange}
        onBodyChange={docsState.handleBodyChange}
        onMoveSection={docsState.handleMoveSection}
        onDeleteSection={docsState.handleDeleteSection}
        onAddSection={docsState.handleAddSection}
      />
    </div>
  );
}

function EditorBody({ notice, t }: { notice: NoticeDetail; t: NoticeEditorMessages }) {
  const docsState = useNoticeEditorDocs(notice, t);
  const { handleSave, handlePublish, save, publish } = useNoticeEditorSave(notice, docsState, t);
  const ai = useNoticeEditorAi(docsState, t);
  const ropa = useNoticeEditorRopa(t);
  const { execFormat } = useNoticeEditorFormatting(docsState.focusIndex, t);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <EditorHeader
        t={t}
        notice={notice}
        docsState={docsState}
        onOpenShare={() => {
          setIsShareOpen(true);
        }}
        onOpenTranslation={() => {
          ai.setIsTranslationModalOpen(true);
        }}
        onSave={() => {
          handleSave(true);
        }}
        onPublish={handlePublish}
        isSaving={save.isPending}
        isPublishing={publish.isPending}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_310px]">
        <DocumentPanel t={t} notice={notice} docsState={docsState} onFormat={execFormat} />

        <div className="flex flex-col gap-4">
          <NoticeAiCard
            t={t}
            focusedHeading={docsState.focusedSec?.heading ?? null}
            onAction={ai.handleAiAction}
          />
          <NoticeCheckCard
            t={t}
            result={ai.noticeCheckResult}
            isChecking={ai.isChecking}
            onRunCheck={ai.handleRunNoticeCheck}
            onFixPlaceholders={ai.handleFixPlaceholders}
          />
          <NoticeSourceCard
            t={t}
            notice={notice}
            isRopaChecking={ropa.isRopaChecking}
            ropaCheckResult={ropa.ropaCheckResult}
            onCheckRopa={ropa.handleCheckRopa}
            onFixRopa={ropa.handleFixRopa}
          />
        </div>
      </div>

      {isShareOpen && (
        <ShareNoticeModal
          isOpen={isShareOpen}
          onClose={() => {
            setIsShareOpen(false);
          }}
          notice={notice}
          t={t}
        />
      )}

      {ai.isTranslationModalOpen && (
        <AddTranslationModal
          isOpen={ai.isTranslationModalOpen}
          onClose={() => {
            ai.setIsTranslationModalOpen(false);
          }}
          currentLangs={docsState.langs}
          onSelectLanguage={docsState.handleSelectTranslation}
          messages={t}
        />
      )}
    </div>
  );
}

export function NoticeEditor({ id, t }: { id: string; t: NoticeEditorMessages }) {
  const { data, isLoading, isError, error } = useNotice(id);

  if (isLoading) return <EditorLoading />;

  if (isError || !data) {
    const isNotFound = error instanceof ApiError && error.code === 'NOT_FOUND';
    return (
      <EmptyState
        label={isNotFound ? t.notFoundTitle : t.loadErrorTitle}
        description={isNotFound ? t.notFoundDescription : t.loadErrorDescription}
        tone="danger"
        actionSlot={
          <Button asChild variant="outline">
            <NextLink href="/notices">{t.backToNotices}</NextLink>
          </Button>
        }
      />
    );
  }

  return <EditorBody key={data.id} notice={data} t={t} />;
}
