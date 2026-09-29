/** Owns search/filter/pagination/modal state for the Notice Manager register. */
import { useState } from 'react';
import { PAGE_SIZE_OPTIONS } from '@shared/lib';
import { useNotice, useNotices, type NoticeSummary } from '@shared/hooks';

function computeAvailableLanguages(notices: readonly NoticeSummary[] | undefined): string[] {
  if (!notices) return ['English'];
  const langs = new Set<string>();
  for (const n of notices) {
    if (n.language) langs.add(n.language);
    if (n.langs) n.langs.forEach((l) => langs.add(l));
  }
  return Array.from(langs);
}

function matchesQuery(notice: NoticeSummary, q: string): boolean {
  if (!q) return true;
  return (
    notice.name.toLowerCase().includes(q) ||
    notice.refCode.toLowerCase().includes(q) ||
    (notice.activityName?.toLowerCase().includes(q) ?? false)
  );
}

function matchesLanguage(notice: NoticeSummary, languageFilter: string): boolean {
  if (languageFilter === 'all') return true;
  return notice.language === languageFilter || (notice.langs?.includes(languageFilter) ?? false);
}

function filterNotices(
  notices: readonly NoticeSummary[],
  query: string,
  statusFilter: string,
  languageFilter: string,
): NoticeSummary[] {
  const q = query.trim().toLowerCase();
  return notices.filter(
    (notice) =>
      matchesQuery(notice, q) &&
      (statusFilter === 'all' || notice.status === statusFilter) &&
      matchesLanguage(notice, languageFilter),
  );
}

export function useNoticesListState() {
  const { data, isLoading, isError } = useNotices();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [activeModalNoticeId, setActiveModalNoticeId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // When a modal notice is selected, fetch its detail
  const { data: modalNoticeDetail } = useNotice(activeModalNoticeId ?? '');

  const availableLanguages = computeAvailableLanguages(data?.notices);
  const filtered = data?.notices
    ? filterNotices(data.notices, query, statusFilter, languageFilter)
    : [];

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const rangeFrom = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, filtered.length);

  function openPreview(id: string) {
    setActiveModalNoticeId(id);
    setIsPreviewOpen(true);
  }

  function openShare(id: string) {
    setActiveModalNoticeId(id);
    setIsShareOpen(true);
  }

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function changeStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function changeLanguageFilter(value: string) {
    setLanguageFilter(value);
    setPage(1);
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return {
    data,
    isLoading,
    isError,
    query,
    setQuery: changeQuery,
    statusFilter,
    setStatusFilter: changeStatusFilter,
    languageFilter,
    setLanguageFilter: changeLanguageFilter,
    page,
    setPage,
    pageSize,
    setPageSize: changePageSize,
    pageCount,
    paged,
    rangeFrom,
    rangeTo,
    isShareOpen,
    setIsShareOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    modalNoticeDetail,
    availableLanguages,
    filtered,
    openPreview,
    openShare,
    setActiveModalNoticeId,
  };
}
