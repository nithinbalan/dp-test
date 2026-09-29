'use client';

/**
 * Per-language document map state + section editing handlers for the Notice
 * Editor. Split out of `NoticeEditor.tsx` (which was pushing 1000+ lines and
 * a single 900-line component) — the mutation logic itself lives in
 * `notice-editor-docs.ts` as plain functions so this hook stays a thin wire-up.
 */
import { useRef, useState } from 'react';
import type { NoticeDetail, NoticeSection } from '@shared/hooks';
import { useToast } from '@shared/hooks';
import {
  NT_EXTRA,
  STANDARD_SECTION_KEYS,
  ntTpl,
  ntTxt2Html,
  type StandardSectionKey,
} from '@/app/api/notices/templates';
import {
  addSectionAcrossDocs,
  buildTranslatedDoc,
  deleteSectionAcrossDocs,
  moveSectionAcrossDocs,
  updateSectionBody,
  updateSectionHeading,
  type DocsMap,
} from './notice-editor-docs';
import type { NoticeEditorMessages } from './NoticeEditorMessages';

function sectionContentFor(key: string): { isUnique: boolean; heading: string; body: string } {
  const isStd = (STANDARD_SECTION_KEYS as readonly string[]).includes(key);
  if (isStd) {
    return { isUnique: false, heading: key, body: ntTxt2Html(ntTpl(key as StandardSectionKey)) };
  }
  const extra = NT_EXTRA.find((e) => e.key === key);
  if (extra) return { isUnique: false, heading: extra.heading, body: ntTxt2Html(extra.body) };
  return {
    isUnique: true,
    heading: 'New Section',
    body: ntTxt2Html('[[describe this section in your own words]]'),
  };
}

function useDocsBaseState(notice: NoticeDetail) {
  const [name, setName] = useState(notice.name);
  const [currentLang, setCurrentLang] = useState(notice.lang ?? 'English');
  const [langs, setLangs] = useState<string[]>(notice.langs ?? ['English']);
  const [docs, setDocs] = useState<DocsMap>(() => {
    if (notice.docs && Object.keys(notice.docs).length > 0) return notice.docs;
    return { [notice.lang ?? 'English']: { name: notice.name, secs: notice.sections } };
  });
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const currentDoc = docs[currentLang] ?? { name, secs: notice.sections };
  const currentSections = currentDoc.secs;
  const focusedSec = focusIndex !== null ? (currentSections[focusIndex] ?? null) : null;

  function handleBodyChange(index: number, newHtml: string) {
    setDocs((prev) => updateSectionBody(prev, currentLang, name, index, newHtml));
  }

  function handleHeadingChange(index: number, newHeading: string) {
    setDocs((prev) => updateSectionHeading(prev, currentLang, name, index, newHeading));
  }

  function handleMoveSection(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= currentSections.length) return;
    setDocs((prev) => moveSectionAcrossDocs(prev, currentSections, index, dir));
    setFocusIndex(target);
  }

  return {
    name,
    setName,
    currentLang,
    setCurrentLang,
    langs,
    setLangs,
    docs,
    setDocs,
    currentDoc,
    currentSections,
    focusIndex,
    setFocusIndex,
    focusedSec,
    handleBodyChange,
    handleHeadingChange,
    handleMoveSection,
  };
}

function useSectionMutations(base: ReturnType<typeof useDocsBaseState>, t: NoticeEditorMessages) {
  const toast = useToast();
  const { docs, setDocs, currentSections, setFocusIndex, langs, setLangs, name, setCurrentLang } =
    base;
  const customSectionCounter = useRef(0);

  function nextCustomSectionKey(): string {
    customSectionCounter.current += 1;
    return `x${String(customSectionCounter.current)}`;
  }

  function handleDeleteSection(index: number) {
    if (currentSections.length < 2) {
      toast.show({ label: t.toastMinSections, tone: 'warning' });
      return;
    }
    const result = deleteSectionAcrossDocs(docs, currentSections, index);
    if (!result) return;
    setDocs(result.docs);
    setFocusIndex(null);
    toast.show({
      label: t.toastSectionRemoved.replace('{section}', result.removedHeading),
      tone: 'neutral',
    });
  }

  function handleAddSection(key: string) {
    const { isUnique, heading, body } = sectionContentFor(key);
    const sectionKey = isUnique ? nextCustomSectionKey() : key;
    setDocs((prev) => addSectionAcrossDocs(prev, sectionKey, heading, body));
    setFocusIndex(currentSections.length);
    toast.show({ label: t.toastSectionAdded.replace('{section}', heading), tone: 'success' });
  }

  function handleSelectTranslation(selectedLang: string) {
    if (!langs.includes(selectedLang)) {
      setLangs([...langs, selectedLang]);
      setDocs((prev) => ({
        ...prev,
        [selectedLang]: buildTranslatedDoc(currentSections, name, selectedLang),
      }));
      toast.show({
        label: t.toastTranslationCreated.replace('{language}', selectedLang),
        tone: 'success',
      });
    }
    setCurrentLang(selectedLang);
  }

  return { handleDeleteSection, handleAddSection, handleSelectTranslation };
}

export function useNoticeEditorDocs(notice: NoticeDetail, t: NoticeEditorMessages) {
  const base = useDocsBaseState(notice);
  const mutations = useSectionMutations(base, t);
  return { ...base, ...mutations };
}

export type NoticeEditorDocsState = ReturnType<typeof useNoticeEditorDocs>;
export type { NoticeSection };
