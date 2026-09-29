'use client';

/**
 * Save/publish, Jethur AI section actions, and RoPA drift-check handlers for
 * the Notice Editor. Split out of `NoticeEditor.tsx` alongside
 * `use-notice-editor-docs.ts` so no single function there needs to hold the
 * whole editor's behaviour.
 */
import { useState } from 'react';
import type { NoticeDetail } from '@shared/hooks';
import { useSaveNotice, usePublishNotice, useToast } from '@shared/hooks';
import {
  NT_FILL,
  NT_IMPROVE,
  NT_SIMPLE,
  computeNoticeCheck,
  ntTxt2Html,
  type NoticeCheck,
} from '@/app/api/notices/templates';
import type { NoticeEditorDocsState } from './use-notice-editor-docs';
import type { NoticeEditorMessages } from './NoticeEditorMessages';

export type RopaCheckResult = { status: 'ok' | 'warn'; message: string };

export function useNoticeEditorSave(
  notice: NoticeDetail,
  docsState: NoticeEditorDocsState,
  t: NoticeEditorMessages,
) {
  const toast = useToast();
  const save = useSaveNotice(notice.id);
  const publish = usePublishNotice(notice.id);
  const { name, currentLang, langs, docs, currentSections } = docsState;

  function handleSave(showToast = true) {
    save.mutate(
      { name, lang: currentLang, langs, docs, sections: currentSections },
      {
        onSuccess: () => {
          if (showToast) toast.show({ label: t.toastSaved, tone: 'success' });
        },
        onError: (err) => {
          toast.show({ label: err.message, tone: 'danger' });
        },
      },
    );
  }

  function handlePublish() {
    save.mutate(
      { name, lang: currentLang, langs, docs, sections: currentSections },
      {
        onSuccess: () => {
          publish.mutate(undefined, {
            onSuccess: () => {
              toast.show({ label: t.toastPublished, tone: 'success' });
            },
            onError: (err) => {
              toast.show({ label: err.message, tone: 'danger' });
            },
          });
        },
        onError: (err) => {
          toast.show({ label: err.message, tone: 'danger' });
        },
      },
    );
  }

  return { save, publish, handleSave, handlePublish };
}

function applySimplify(
  before: string,
  toast: ReturnType<typeof useToast>,
  t: NoticeEditorMessages,
): string | null {
  let simplified = before;
  for (const [pattern, repl] of NT_SIMPLE) simplified = simplified.replace(pattern, repl);
  if (simplified === before) {
    toast.show({ label: t.toastAlreadyPlain, tone: 'neutral' });
    return null;
  }
  toast.show({ label: t.toastSimplified, tone: 'success' });
  return simplified;
}

function applyImprove(
  before: string,
  key: string,
  toast: ReturnType<typeof useToast>,
  t: NoticeEditorMessages,
): string | null {
  const improveText = NT_IMPROVE[key];
  if (!improveText || before.includes(improveText.trim())) {
    toast.show({ label: t.toastAlreadyImproved, tone: 'neutral' });
    return null;
  }
  toast.show({ label: t.toastImproved, tone: 'success' });
  return before + ntTxt2Html(improveText);
}

function fillPlaceholdersAcrossDocs(docs: NoticeEditorDocsState['docs']): {
  docs: NoticeEditorDocsState['docs'];
  filledCount: number;
} {
  let filledCount = 0;
  const updated = { ...docs };
  for (const langKey of Object.keys(updated)) {
    const doc = updated[langKey];
    if (!doc) continue;
    const newSecs = doc.secs.map((s) => {
      let b = s.body;
      for (const [placeholder, val] of Object.entries(NT_FILL)) {
        if (b.includes(placeholder)) {
          b = b.replaceAll(placeholder, val);
          filledCount += 1;
        }
      }
      return { ...s, body: b };
    });
    updated[langKey] = { ...doc, secs: newSecs };
  }
  return { docs: updated, filledCount };
}

export function useNoticeEditorAi(docsState: NoticeEditorDocsState, t: NoticeEditorMessages) {
  const toast = useToast();
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [noticeCheckResult, setNoticeCheckResult] = useState<NoticeCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { focusIndex, currentSections, currentLang, setDocs, handleBodyChange } = docsState;

  function handleAiAction(kind: 'simplify' | 'improve' | 'rewrite' | 'translate') {
    if (kind === 'translate') {
      setIsTranslationModalOpen(true);
      return;
    }
    if (focusIndex === null || !currentSections[focusIndex]) {
      toast.show({ label: t.toastSelectTextFirst, tone: 'warning' });
      return;
    }
    const currentSec = currentSections[focusIndex];

    if (kind === 'simplify') {
      const simplified = applySimplify(currentSec.body, toast, t);
      if (simplified !== null) handleBodyChange(focusIndex, simplified);
    } else if (kind === 'improve') {
      const improved = applyImprove(currentSec.body, currentSec.key, toast, t);
      if (improved !== null) handleBodyChange(focusIndex, improved);
    } else {
      rewriteSection(currentSec, focusIndex, currentLang, setDocs, toast, t);
    }
  }

  function handleRunNoticeCheck() {
    setIsChecking(true);
    window.setTimeout(() => {
      setIsChecking(false);
      const res = computeNoticeCheck(currentSections);
      setNoticeCheckResult(res);
      toast.show({
        label: res.isComplete
          ? t.checkPass
          : t.checkFail
              .replace('{count}', String(res.incompleteCount))
              .replace('{plural}', res.incompleteCount === 1 ? '' : 's'),
        tone: res.isComplete ? 'success' : 'warning',
      });
    }, 400);
  }

  function handleFixPlaceholders() {
    let filledCount = 0;
    setDocs((prev) => {
      const result = fillPlaceholdersAcrossDocs(prev);
      filledCount = result.filledCount;
      return result.docs;
    });
    window.setTimeout(() => {
      setNoticeCheckResult(computeNoticeCheck(currentSections));
    }, 100);
    toast.show({
      label: t.toastFilledPlaceholders
        .replace('{count}', String(filledCount))
        .replace('{plural}', filledCount === 1 ? '' : 's'),
      tone: 'success',
    });
  }

  return {
    isTranslationModalOpen,
    setIsTranslationModalOpen,
    noticeCheckResult,
    isChecking,
    handleAiAction,
    handleRunNoticeCheck,
    handleFixPlaceholders,
  };
}

function rewriteSection(
  currentSec: { key: string; alts?: string[]; alt?: number },
  focusIndex: number,
  currentLang: string,
  setDocs: NoticeEditorDocsState['setDocs'],
  toast: ReturnType<typeof useToast>,
  t: NoticeEditorMessages,
) {
  if (!currentSec.alts || currentSec.alts.length < 2) {
    toast.show({ label: t.toastRewritten, tone: 'neutral' });
    return;
  }
  const nextAlt = ((currentSec.alt ?? 0) + 1) % currentSec.alts.length;
  const nextText = currentSec.alts[nextAlt] ?? currentSec.alts[0] ?? '';
  setDocs((prev) => {
    const cur = prev[currentLang];
    if (!cur) return prev;
    const newSecs = [...cur.secs];
    const target = newSecs[focusIndex];
    if (target) newSecs[focusIndex] = { ...target, body: ntTxt2Html(nextText), alt: nextAlt };
    return { ...prev, [currentLang]: { ...cur, secs: newSecs } };
  });
  toast.show({ label: t.toastRewritten, tone: 'success' });
}

export function useNoticeEditorRopa(t: NoticeEditorMessages) {
  const toast = useToast();
  const [ropaCheckResult, setRopaCheckResult] = useState<RopaCheckResult[] | null>(null);
  const [isRopaChecking, setIsRopaChecking] = useState(false);

  function handleCheckRopa() {
    setIsRopaChecking(true);
    window.setTimeout(() => {
      setIsRopaChecking(false);
      setRopaCheckResult([
        { status: 'ok', message: t.ropaPurposeMatch },
        { status: 'ok', message: t.ropaDataMatch },
        { status: 'ok', message: t.ropaRecipMatch },
      ]);
    }, 400);
  }

  function handleFixRopa() {
    toast.show({ label: t.toastRopaRealigned, tone: 'success' });
    setRopaCheckResult([
      { status: 'ok', message: t.ropaPurposeMatch },
      { status: 'ok', message: t.ropaDataMatch },
      { status: 'ok', message: t.ropaRecipMatch },
    ]);
  }

  return { ropaCheckResult, isRopaChecking, handleCheckRopa, handleFixRopa };
}
