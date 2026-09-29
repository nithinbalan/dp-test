'use client';

import { useState } from 'react';
import { Eye, Globe, Printer, X } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Heading } from '@atoms/Heading';
import { NT_DPO, NT_L8, NT_ORG } from '@app/api/notices/templates';
import { formatDate, cn } from '@shared/lib';
import type { NoticeDetail } from '@shared/hooks';

type PreviewMessages = {
  previewHeaderTitle: string;
  previewReadIn: string;
  previewMachineTranslated: string;
  previewEffective: string;
  previewPublishedWith: string;
  printCta: string;
  closeCta: string;
  brandDomain: string;
};

function PreviewToolbar({ messages, onClose }: { messages: PreviewMessages; onClose: () => void }) {
  return (
    <div className="bg-bg-inverse text-fg-inverse sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-3 text-xs print:hidden">
      <div className="flex items-center gap-2 font-medium">
        <Eye className="text-accent-solid size-4" />
        <span>{messages.previewHeaderTitle}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.print();
          }}
          startSlot={<Printer className="size-4" />}
          className="border-white/20 text-white hover:bg-white/10"
        >
          {messages.printCta}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label={messages.closeCta}
          className="text-white hover:bg-white/10"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function LanguagePickerStrip({
  messages,
  availableLangs,
  currentLang,
  onSelect,
}: {
  messages: PreviewMessages;
  availableLangs: readonly string[];
  currentLang: string;
  onSelect: (lang: string) => void;
}) {
  if (availableLangs.length <= 1) return null;
  return (
    <div className="bg-bg-canvas border-border-default mb-8 flex flex-wrap items-center gap-2 rounded-xl border p-3 print:hidden">
      <span className="text-fg-muted flex items-center gap-1.5 text-xs">
        <Globe className="text-brand-solid size-4" />
        {messages.previewReadIn}
      </span>
      {availableLangs.map((langName) => {
        const info = NT_L8.find((l) => l.en === langName) ?? { en: langName, nat: langName };
        const isActive = langName === currentLang;
        return (
          <button
            key={langName}
            type="button"
            onClick={() => {
              onSelect(langName);
            }}
            dir={info.rtl ? 'rtl' : 'ltr'}
            className={cn(
              'rounded-pill border px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? 'bg-bg-inverse text-fg-inverse border-transparent font-semibold'
                : 'border-border-default bg-white text-slate-800 hover:border-slate-400',
            )}
          >
            {info.nat}
          </button>
        );
      })}
    </div>
  );
}

function PreviewSections({ sections }: { sections: NoticeDetail['sections'] }) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.key} className="flex flex-col gap-2">
          <Heading level={2} size="sm" className="text-base font-bold text-slate-900">
            {section.heading}
          </Heading>
          <div className="text-sm leading-relaxed whitespace-pre-line text-slate-800">
            {section.body}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PublicPreviewModal({
  isOpen,
  onClose,
  notice,
  messages,
}: {
  isOpen: boolean;
  onClose: () => void;
  notice: NoticeDetail | null;
  messages: PreviewMessages;
}) {
  const [selectedLang, setSelectedLang] = useState('English');

  if (!isOpen || !notice) return null;

  const currentLang = notice.langs?.includes(selectedLang)
    ? selectedLang
    : notice.language || 'English';
  const langInfo = NT_L8.find((l) => l.en === currentLang) ?? { en: currentLang, nat: currentLang };
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://privacy.jethur.ai';
  const publicUrl = `${origin}/notices/${notice.id}/preview`;

  const availableLangs = notice.langs && notice.langs.length > 0 ? notice.langs : ['English'];

  const effectiveText = messages.previewEffective
    .replace('{date}', formatDate(notice.updatedAt).toUpperCase())
    .replace('{version}', notice.version)
    .replace('{language}', currentLang.toUpperCase());

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white"
    >
      <PreviewToolbar messages={messages} onClose={onClose} />

      {/* Rendered notice container matching prototype `.nv-page` */}
      <div className="mx-auto w-full max-w-3xl px-6 py-12 leading-relaxed text-slate-900 print:max-w-none print:p-0">
        {/* Brand Header */}
        <div className="border-border-strong mb-6 flex items-center gap-3 border-b pb-5">
          <div className="bg-bg-inverse text-accent-solid rounded-control grid size-10 place-items-center text-lg font-bold">
            {NT_ORG.charAt(0)}
          </div>
          <div>
            <span className="block text-base font-bold text-slate-900">{NT_ORG}</span>
            <span className="block text-xs text-slate-600">{messages.brandDomain}</span>
          </div>
        </div>

        <LanguagePickerStrip
          messages={messages}
          availableLangs={availableLangs}
          currentLang={currentLang}
          onSelect={setSelectedLang}
        />

        {/* Notice Title and Effective Metadata */}
        <div dir={langInfo.rtl ? 'rtl' : 'ltr'}>
          <Heading
            level={1}
            size="xl"
            className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl"
          >
            {notice.name}
          </Heading>
          <div className="mt-2 mb-8 font-mono text-xs tracking-wider text-slate-600 uppercase">
            {effectiveText}
          </div>

          <PreviewSections sections={notice.sections} />

          {/* Footer */}
          <div className="border-border-default mt-12 border-t pt-5 text-xs text-slate-600">
            <div>
              {NT_ORG} · {NT_DPO}
            </div>
            <div className="mt-1">
              {messages.previewPublishedWith} · {publicUrl}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
