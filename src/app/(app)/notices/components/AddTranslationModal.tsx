'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import { SearchInput } from '@molecules/SearchInput';
import { Dialog } from '@organisms/Dialog';
import { NT_H, NT_L8 } from '@app/api/notices/templates';
import { cn } from '@shared/lib';

type TranslationMessages = {
  langModalStep: string;
  langModalTitle: string;
  langModalSub: string;
  langModalSearchPlaceholder: string;
  langModalAiNote: string;
  aiLabel: string;
};

function LanguageOption({
  lang,
  isAdded,
  aiLabel,
  onSelect,
}: {
  lang: (typeof NT_L8)[number];
  isAdded: boolean;
  aiLabel: string;
  onSelect: () => void;
}) {
  const isVerified = Boolean(NT_H[lang.en]);
  return (
    <button
      type="button"
      disabled={isAdded}
      onClick={onSelect}
      className={cn(
        'border-border-default bg-bg-surface relative flex flex-col items-start rounded-xl border p-3 text-start transition-colors',
        isAdded
          ? 'border-brand-solid bg-brand-subtle cursor-default'
          : 'hover:border-brand-solid hover:bg-brand-subtle/50 cursor-pointer',
      )}
    >
      <span
        className={cn('text-sm font-semibold', isAdded ? 'text-brand-fg' : 'text-fg-default')}
        dir={lang.rtl ? 'rtl' : 'ltr'}
      >
        {lang.nat}
      </span>
      <span className={cn('mt-0.5 text-xs', isAdded ? 'text-brand-fg/80' : 'text-fg-muted')}>
        {lang.en}
      </span>

      {isAdded ? (
        <Check className="text-brand-fg absolute end-2.5 top-2.5 size-4" />
      ) : !isVerified ? (
        <Badge
          tone="warning"
          variant="soft"
          size="sm"
          className="text-2xs absolute end-2.5 top-2.5"
        >
          {aiLabel}
        </Badge>
      ) : null}
    </button>
  );
}

export function AddTranslationModal({
  isOpen,
  onClose,
  currentLangs,
  onSelectLanguage,
  messages,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentLangs: readonly string[];
  onSelectLanguage: (language: string) => void;
  messages: TranslationMessages;
}) {
  const [query, setQuery] = useState('');

  const filteredLanguages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NT_L8;
    return NT_L8.filter(
      (lang) => lang.en.toLowerCase().includes(q) || lang.nat.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      label={messages.langModalTitle}
      description={messages.langModalSub}
    >
      <div className="flex flex-col gap-4">
        <div>
          <Text as="span" size="2xs" tone="subtle" isMono className="tracking-widest uppercase">
            {messages.langModalStep}
          </Text>
          <Heading level={2} size="md">
            {messages.langModalTitle}
          </Heading>
          <Text size="xs" tone="muted" className="mt-1">
            {messages.langModalSub}
          </Text>
        </div>

        <SearchInput
          value={query}
          onValueChange={setQuery}
          messages={{
            label: messages.langModalSearchPlaceholder,
            placeholder: messages.langModalSearchPlaceholder,
          }}
          fullWidth
        />

        <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pe-1 sm:grid-cols-3 md:grid-cols-4">
          {filteredLanguages.map((lang) => {
            const isAdded = currentLangs.includes(lang.en);
            return (
              <LanguageOption
                key={lang.en}
                lang={lang}
                isAdded={isAdded}
                aiLabel={messages.aiLabel}
                onSelect={() => {
                  if (!isAdded) {
                    onSelectLanguage(lang.en);
                    onClose();
                  }
                }}
              />
            );
          })}
        </div>

        <Text size="xs" tone="muted" className="border-border-default border-t pt-3">
          <span className="bg-warning-subtle text-warning-fg text-2xs rounded-sm px-1 py-0.5 font-bold">
            {messages.aiLabel}
          </span>{' '}
          {messages.langModalAiNote}
        </Text>
      </div>
    </Dialog>
  );
}
