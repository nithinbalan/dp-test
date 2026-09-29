/** The pagination summary, page-size select and page controls below the Notice Manager table. */
import { Select, type SelectOption } from '@atoms/Select';
import { Text } from '@atoms/Text';
import { Pagination } from '@molecules/Pagination';
import { PAGE_SIZE_OPTIONS } from '@shared/lib';
import type { NoticesMessages } from './NoticesMessages';

const PAGE_SIZE_SELECT_OPTIONS: SelectOption[] = PAGE_SIZE_OPTIONS.map((size) => ({
  value: String(size),
  label: String(size),
}));

/** The "10 / 25 / 50 rows per page" control that sits beside the pagination summary. */
function PageSizeSelect({
  t,
  pageSize,
  onPageSizeChange,
}: {
  t: NoticesMessages;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Text as="span" size="xs" tone="muted">
        {t.pageSizeLabel}
      </Text>
      <Select
        options={PAGE_SIZE_SELECT_OPTIONS}
        value={String(pageSize)}
        onValueChange={(value) => {
          onPageSizeChange(Number(value));
        }}
        size="sm"
        aria-label={t.pageSizeLabel}
        className="w-18"
      />
    </div>
  );
}

/** Pagination summary, the page-size select and the page controls, in one row. */
export function RegisterPagination({
  t,
  page,
  pageCount,
  pageSize,
  rangeFrom,
  rangeTo,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  t: NoticesMessages;
  page: number;
  pageCount: number;
  pageSize: number;
  rangeFrom: number;
  rangeTo: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Text size="xs" tone="muted">
          {t.paginationSummary
            .replace('{from}', String(rangeFrom))
            .replace('{to}', String(rangeTo))
            .replace('{total}', String(total))}
        </Text>
        <PageSizeSelect t={t} pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
      </div>
      <Pagination page={page} pageCount={pageCount} onValueChange={onPageChange} size="sm" />
    </div>
  );
}
