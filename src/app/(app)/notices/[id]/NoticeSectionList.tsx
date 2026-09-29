'use client';

/** The document's section list (heading + rich-text body, per-row move/delete) and the
 * "Add section" menu — split out of `NoticeEditor.tsx` to keep that file under budget. */
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  NT_EXTRA,
  NT_H,
  STANDARD_SECTION_KEYS,
  ntTxt2Html,
  type OptionalSectionKey,
} from '@/app/api/notices/templates';
import type { NoticeSection } from '@shared/hooks';
import type { NoticeEditorMessages } from './NoticeEditorMessages';

function SectionRowActions({
  index,
  sectionCount,
  onMoveUp,
  onMoveDown,
  onDelete,
  t,
}: {
  index: number;
  sectionCount: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  t: NoticeEditorMessages;
}) {
  return (
    <div className="absolute end-2.5 top-2.5 z-10 flex items-center gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
      <button
        type="button"
        title={t.toolbarMoveUp}
        disabled={index === 0}
        onClick={(e) => {
          e.stopPropagation();
          onMoveUp();
        }}
        className="border-border-default bg-bg-surface text-fg-muted hover:border-brand-solid hover:text-brand-fg grid size-6 place-items-center rounded border shadow-xs disabled:opacity-30"
      >
        <ArrowUp className="size-3" />
      </button>
      <button
        type="button"
        title={t.toolbarMoveDown}
        disabled={index === sectionCount - 1}
        onClick={(e) => {
          e.stopPropagation();
          onMoveDown();
        }}
        className="border-border-default bg-bg-surface text-fg-muted hover:border-brand-solid hover:text-brand-fg grid size-6 place-items-center rounded border shadow-xs disabled:opacity-30"
      >
        <ArrowDown className="size-3" />
      </button>
      <button
        type="button"
        title={t.toolbarDelete}
        disabled={sectionCount < 2}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="border-border-default bg-bg-surface text-fg-muted hover:border-danger-solid hover:bg-danger-subtle hover:text-danger-fg grid size-6 place-items-center rounded border shadow-xs disabled:opacity-30"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}

function SectionRow({
  sec,
  index,
  isFocused,
  sectionCount,
  onFocus,
  onHeadingChange,
  onBodyChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  t,
}: {
  sec: NoticeSection;
  index: number;
  isFocused: boolean;
  sectionCount: number;
  onFocus: () => void;
  onHeadingChange: (value: string) => void;
  onBodyChange: (html: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  t: NoticeEditorMessages;
}) {
  return (
    <div
      className={
        isFocused
          ? 'group border-brand-solid/50 bg-brand-subtle/30 ring-brand-solid/20 relative rounded-xl border p-3.5 ring-1 transition-all'
          : 'group hover:border-border-default relative rounded-xl border border-transparent p-3.5 transition-all'
      }
      onClick={onFocus}
    >
      <SectionRowActions
        index={index}
        sectionCount={sectionCount}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDelete={onDelete}
        t={t}
      />

      <input
        type="text"
        value={sec.heading}
        onFocus={onFocus}
        onChange={(e) => {
          onHeadingChange(e.target.value);
        }}
        className="text-fg-default hover:border-border-default focus:border-brand-solid focus:bg-bg-surface w-full rounded-md border border-transparent bg-transparent pe-20 font-bold transition-colors focus:outline-none"
      />

      <div
        contentEditable
        suppressContentEditableWarning
        onFocus={onFocus}
        onBlur={(e) => {
          onBodyChange(e.currentTarget.innerHTML);
        }}
        dangerouslySetInnerHTML={{ __html: ntTxt2Html(sec.body) }}
        className="text-fg-default hover:border-border-default focus:border-brand-solid focus:bg-bg-surface [&_a]:text-brand-fg mt-2 min-h-16 rounded-lg border border-transparent p-1.5 text-sm leading-relaxed transition-colors focus:outline-none [&_a]:underline [&_li]:mb-1 [&_p]:mb-2 [&_ul]:ms-4 [&_ul]:list-disc"
      />
    </div>
  );
}

function AddSectionMenuOption({
  label,
  sub,
  onSelect,
}: {
  label: string;
  sub: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-fg-default hover:bg-brand-subtle hover:text-brand-fg flex w-full flex-col items-start rounded-lg px-2.5 py-2 text-start text-xs font-medium"
    >
      <span>{label}</span>
      <span className="text-2xs text-fg-muted">{sub}</span>
    </button>
  );
}

function RequiredSectionGroup({
  t,
  currentLang,
  missingRequired,
  onSelect,
}: {
  t: NoticeEditorMessages;
  currentLang: string;
  missingRequired: readonly string[];
  onSelect: (key: string) => void;
}) {
  if (missingRequired.length === 0) return null;
  const hList = NT_H[currentLang] ?? NT_H.English ?? [];

  return (
    <div>
      <div className="text-2xs text-fg-muted px-2.5 py-1.5 font-mono tracking-wider uppercase">
        {t.addSectionRequiredGroup}
      </div>
      {missingRequired.map((k) => {
        const idx = STANDARD_SECTION_KEYS.indexOf(k as (typeof STANDARD_SECTION_KEYS)[number]);
        const label = hList[idx] ?? NT_H.English?.[idx] ?? k;
        return (
          <AddSectionMenuOption
            key={k}
            label={label}
            sub={t.addSectionRequiredSub}
            onSelect={() => {
              onSelect(k);
            }}
          />
        );
      })}
    </div>
  );
}

function OptionalSectionGroup({
  t,
  missingOptional,
  onSelect,
}: {
  t: NoticeEditorMessages;
  missingOptional: readonly { key: OptionalSectionKey; heading: string; note: string }[];
  onSelect: (key: string) => void;
}) {
  if (missingOptional.length === 0) return null;
  return (
    <div className="border-border-default/60 mt-1 border-t pt-1">
      <div className="text-2xs text-fg-muted px-2.5 py-1.5 font-mono tracking-wider uppercase">
        {t.addSectionOptionalGroup}
      </div>
      {missingOptional.map((e) => (
        <AddSectionMenuOption
          key={e.key}
          label={e.heading}
          sub={e.note}
          onSelect={() => {
            onSelect(e.key);
          }}
        />
      ))}
    </div>
  );
}

function AddSectionMenu({
  t,
  currentLang,
  missingRequired,
  missingOptional,
  onAddSection,
}: {
  t: NoticeEditorMessages;
  currentLang: string;
  missingRequired: readonly string[];
  missingOptional: readonly { key: OptionalSectionKey; heading: string; note: string }[];
  onAddSection: (key: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function selectAndClose(key: string) {
    setIsOpen(false);
    onAddSection(key);
  }

  return (
    <div ref={menuRef} className="border-border-default relative mt-6 border-t border-dashed pt-4">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="border-brand-solid bg-brand-subtle/40 text-brand-fg hover:bg-bg-surface inline-flex items-center gap-2 rounded-xl border border-dashed px-4 py-2 text-xs font-semibold transition-colors"
      >
        <Plus className="size-4" />
        {t.addSectionCta}
      </button>

      {isOpen && (
        <div className="border-border-default bg-bg-surface absolute start-0 bottom-full z-30 mb-2 max-h-80 w-80 overflow-y-auto rounded-xl border p-2 shadow-xl">
          <RequiredSectionGroup
            t={t}
            currentLang={currentLang}
            missingRequired={missingRequired}
            onSelect={selectAndClose}
          />
          <OptionalSectionGroup t={t} missingOptional={missingOptional} onSelect={selectAndClose} />

          <div className="border-border-default/60 mt-1 border-t pt-1">
            <div className="text-2xs text-fg-muted px-2.5 py-1.5 font-mono tracking-wider uppercase">
              {t.addSectionCustomGroup}
            </div>
            <AddSectionMenuOption
              label={t.addSectionBlank}
              sub={t.addSectionBlankSub}
              onSelect={() => {
                selectAndClose('blank');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function NoticeSectionList({
  t,
  currentLang,
  sections,
  focusIndex,
  onFocus,
  onHeadingChange,
  onBodyChange,
  onMoveSection,
  onDeleteSection,
  onAddSection,
}: {
  t: NoticeEditorMessages;
  currentLang: string;
  sections: readonly NoticeSection[];
  focusIndex: number | null;
  onFocus: (index: number) => void;
  onHeadingChange: (index: number, value: string) => void;
  onBodyChange: (index: number, html: string) => void;
  onMoveSection: (index: number, dir: -1 | 1) => void;
  onDeleteSection: (index: number) => void;
  onAddSection: (key: string) => void;
}) {
  const existingKeys = new Set(sections.map((s) => s.key));
  const missingRequired = STANDARD_SECTION_KEYS.filter((k) => !existingKeys.has(k));
  const missingOptional = NT_EXTRA.filter((e) => !existingKeys.has(e.key));

  return (
    <>
      <div className="flex flex-col gap-5">
        {sections.map((sec, i) => (
          <SectionRow
            key={sec.key || i}
            sec={sec}
            index={i}
            isFocused={focusIndex === i}
            sectionCount={sections.length}
            t={t}
            onFocus={() => {
              onFocus(i);
            }}
            onHeadingChange={(value) => {
              onHeadingChange(i, value);
            }}
            onBodyChange={(html) => {
              onBodyChange(i, html);
            }}
            onMoveUp={() => {
              onMoveSection(i, -1);
            }}
            onMoveDown={() => {
              onMoveSection(i, 1);
            }}
            onDelete={() => {
              onDeleteSection(i);
            }}
          />
        ))}
      </div>

      <AddSectionMenu
        t={t}
        currentLang={currentLang}
        missingRequired={missingRequired}
        missingOptional={missingOptional}
        onAddSection={onAddSection}
      />
    </>
  );
}
