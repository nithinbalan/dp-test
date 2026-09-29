/**
 * Pure per-language document map helpers for the Notice Editor. Kept out of
 * `NoticeEditor.tsx` so the component's state hook stays thin — each of these
 * used to be a `setDocs((prev) => ...)` closure inline in the component,
 * which is what pushed that file past the max-lines-per-function budget.
 */
import type { NoticeSection } from '@shared/hooks';
import { NT_H, STANDARD_SECTION_KEYS, type StandardSectionKey } from '@/app/api/notices/templates';

export type DocRecord = {
  name: string;
  secs: NoticeSection[];
};

export type DocsMap = Record<string, DocRecord>;

function docOrEmpty(docs: DocsMap, lang: string, fallbackName: string): DocRecord {
  return docs[lang] ?? { name: fallbackName, secs: [] };
}

export function updateSectionBody(
  docs: DocsMap,
  lang: string,
  fallbackName: string,
  index: number,
  newHtml: string,
): DocsMap {
  const cur = docOrEmpty(docs, lang, fallbackName);
  const newSecs = [...cur.secs];
  const target = newSecs[index];
  if (target) newSecs[index] = { ...target, body: newHtml };
  return { ...docs, [lang]: { ...cur, secs: newSecs } };
}

export function updateSectionHeading(
  docs: DocsMap,
  lang: string,
  fallbackName: string,
  index: number,
  newHeading: string,
): DocsMap {
  const cur = docOrEmpty(docs, lang, fallbackName);
  const newSecs = [...cur.secs];
  const target = newSecs[index];
  if (target) newSecs[index] = { ...target, heading: newHeading };
  return { ...docs, [lang]: { ...cur, secs: newSecs } };
}

export function moveSectionAcrossDocs(
  docs: DocsMap,
  currentSections: NoticeSection[],
  index: number,
  dir: -1 | 1,
): DocsMap {
  const key = currentSections[index]?.key;
  const updated = { ...docs };
  for (const langKey of Object.keys(updated)) {
    const doc = updated[langKey];
    if (!doc) continue;
    const newSecs = [...doc.secs];
    const a = newSecs.findIndex((s) => s.key === key);
    const b = a + dir;
    if (a < 0 || b < 0 || b >= newSecs.length) continue;
    const temp = newSecs[a];
    const other = newSecs[b];
    if (!temp || !other) continue;
    newSecs[a] = other;
    newSecs[b] = temp;
    updated[langKey] = { ...doc, secs: newSecs };
  }
  return updated;
}

export function deleteSectionAcrossDocs(
  docs: DocsMap,
  currentSections: NoticeSection[],
  index: number,
): { docs: DocsMap; removedHeading: string } | null {
  const target = currentSections[index];
  if (!target) return null;
  const updated = { ...docs };
  for (const langKey of Object.keys(updated)) {
    const doc = updated[langKey];
    if (!doc) continue;
    updated[langKey] = { ...doc, secs: doc.secs.filter((s) => s.key !== target.key) };
  }
  return { docs: updated, removedHeading: target.heading };
}

function headingForNewSection(langKey: string, stdIdx: number, fallback: string): string {
  const hList = NT_H[langKey] ?? NT_H.English ?? [];
  return hList[stdIdx] ?? NT_H.English?.[stdIdx] ?? fallback;
}

export function addSectionAcrossDocs(
  docs: DocsMap,
  key: string,
  heading: string,
  body: string,
): DocsMap {
  const isStd = (STANDARD_SECTION_KEYS as readonly string[]).includes(key);
  const stdIdx = isStd ? STANDARD_SECTION_KEYS.indexOf(key as StandardSectionKey) : -1;
  const updated = { ...docs };
  for (const langKey of Object.keys(updated)) {
    const doc = updated[langKey];
    if (!doc) continue;
    const langHeading = stdIdx >= 0 ? headingForNewSection(langKey, stdIdx, heading) : heading;
    updated[langKey] = {
      ...doc,
      secs: [...doc.secs, { key, heading: langHeading, body, alts: [body], alt: 0 }],
    };
  }
  return updated;
}

export function buildTranslatedDoc(
  currentSections: NoticeSection[],
  name: string,
  selectedLang: string,
): DocRecord {
  const hList = NT_H[selectedLang] ?? NT_H.English ?? [];
  const secs = currentSections.map((s) => {
    const stdIdx = STANDARD_SECTION_KEYS.indexOf(s.key as StandardSectionKey);
    const heading = stdIdx >= 0 && hList[stdIdx] ? hList[stdIdx] : s.heading;
    return { ...s, heading };
  });
  return { name: `${name} (${selectedLang})`, secs };
}
