/**
 * @tier molecules
 *
 * Page navigation. Composes Button and IconButton. The chevrons mirror in RTL —
 * "previous" points toward the start of the text, whichever side that is.
 */
import { Button } from '@atoms/Button';
import { IconButton } from '@atoms/IconButton';
import { cn } from '@shared/lib';
import type { PaginationMessages, PaginationProps } from './Pagination.types';

const DEFAULT_MESSAGES: PaginationMessages = {
  label: 'Pagination',
  previous: 'Previous page',
  next: 'Next page',
  page: 'Page {page}',
  currentPage: 'Page {page}, current page',
};

const GAP = 'gap';

/**
 * The visible window: always the first and last page, a run around the current
 * one, and a gap marker where pages were skipped. Emitting all N pages would put
 * a thousand controls in the accessibility tree of a thousand-page table.
 */
function buildRange(page: number, pageCount: number, siblingCount: number): (number | 'gap')[] {
  if (pageCount <= siblingCount + 2) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const half = Math.floor(siblingCount / 2);
  let start = Math.max(2, page - half);
  const end = Math.min(pageCount - 1, start + siblingCount - 1);
  start = Math.max(2, end - siblingCount + 1);

  const range: (number | 'gap')[] = [1];
  if (start > 2) range.push(GAP);
  for (let n = start; n <= end; n++) range.push(n);
  if (end < pageCount - 1) range.push(GAP);
  range.push(pageCount);
  return range;
}

const Chevron = ({ isBack }: { isBack: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    className={cn('size-4', isBack ? 'rotate-180' : undefined, 'rtl:-scale-x-100')}
  >
    <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export function Pagination({
  page,
  pageCount,
  onValueChange,
  siblingCount = 5,
  messages,
  size = 'md',
  isDisabled = false,
  className,
  testId,
}: PaginationProps) {
  const t = { ...DEFAULT_MESSAGES, ...messages };

  // One page needs no navigation, and rendering a disabled pair of arrows over an
  // empty table is chrome that says nothing.
  if (pageCount <= 1) return null;

  const controlSize = size === 'sm' ? 'sm' : 'md';

  return (
    <nav
      aria-label={t.label}
      data-testid={testId}
      className={cn('flex items-center gap-1', className)}
    >
      <IconButton
        label={t.previous}
        size={controlSize}
        variant="ghost"
        isDisabled={isDisabled || page <= 1}
        onClick={() => {
          onValueChange(page - 1);
        }}
      >
        <Chevron isBack />
      </IconButton>

      {buildRange(page, pageCount, siblingCount).map((entry, index) =>
        entry === GAP ? (
          <span
            key={`gap-${String(index)}`}
            aria-hidden
            className="text-fg-subtle grid size-9 place-items-center text-sm"
          >
            {'…'}
          </span>
        ) : (
          <Button
            key={entry}
            size={controlSize}
            variant={entry === page ? 'solid' : 'ghost'}
            tone={entry === page ? 'brand' : 'neutral'}
            // `aria-current` is what says "you are here"; the fill is only the
            // sighted half of that signal.
            aria-current={entry === page ? 'page' : undefined}
            aria-label={(entry === page ? t.currentPage : t.page).replace('{page}', String(entry))}
            isDisabled={isDisabled}
            onClick={() => {
              onValueChange(entry);
            }}
            className="min-w-9 px-2 font-mono"
          >
            {entry}
          </Button>
        ),
      )}

      <IconButton
        label={t.next}
        size={controlSize}
        variant="ghost"
        isDisabled={isDisabled || page >= pageCount}
        onClick={() => {
          onValueChange(page + 1);
        }}
      >
        <Chevron isBack={false} />
      </IconButton>
    </nav>
  );
}
