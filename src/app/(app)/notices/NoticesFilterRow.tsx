/** The search input plus status/language facets above the Notice Manager table. */
import { Select, type SelectOption } from '@atoms/Select';
import { Skeleton } from '@atoms/Skeleton';
import { SearchInput } from '@molecules/SearchInput';
import { NT_L8 } from '@app/api/notices/templates';
import type { NoticesMessages } from './NoticesMessages';

/** Disabled controls in the loading skeleton still need a handler to satisfy their type. */
const NOOP = () => {
  /* disabled during loading */
};

function statusOptionsFor(t: NoticesMessages): SelectOption[] {
  return [
    { value: 'all', label: t.statusAll },
    { value: 'published', label: t.statusPublished },
    { value: 'draft', label: t.statusDraft },
  ];
}

export function FilterRow({
  t,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  languageFilter,
  onLanguageFilterChange,
  availableLanguages,
}: {
  t: NoticesMessages;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  languageFilter: string;
  onLanguageFilterChange: (value: string) => void;
  availableLanguages: readonly string[];
}) {
  const languageOptions: SelectOption[] = [
    { value: 'all', label: t.languageAll },
    ...availableLanguages.map((l) => {
      const info = NT_L8.find((item) => item.en === l) ?? { en: l, nat: l };
      return {
        value: l,
        label: info.nat === info.en ? info.en : `${info.en} · ${info.nat}`,
      };
    }),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={query}
        onValueChange={onQueryChange}
        messages={{ label: t.searchPlaceholder, placeholder: t.searchPlaceholder }}
        className="min-w-64 flex-1"
      />
      <Select
        options={statusOptionsFor(t)}
        value={statusFilter}
        onValueChange={onStatusFilterChange}
        aria-label={t.statusFilterLabel}
      />
      <Select
        options={languageOptions}
        value={languageFilter}
        onValueChange={onLanguageFilterChange}
        aria-label={t.languageFilterLabel}
      />
    </div>
  );
}

/**
 * Same filter row `NoticesRegister` renders — the search input and status
 * select are real (their copy and options are static), just disabled; the
 * language select is a skeleton bar because its OPTIONS come from the
 * notices this fetch hasn't returned yet.
 */
export function FilterRowSkeleton({ t }: { t: NoticesMessages }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value=""
        onValueChange={NOOP}
        messages={{ label: t.searchPlaceholder, placeholder: t.searchPlaceholder }}
        className="min-w-64 flex-1"
        isDisabled
      />
      <Select
        options={statusOptionsFor(t)}
        value="all"
        onValueChange={NOOP}
        aria-label={t.statusFilterLabel}
        isDisabled
      />
      <Skeleton className="h-9 w-32" />
    </div>
  );
}
