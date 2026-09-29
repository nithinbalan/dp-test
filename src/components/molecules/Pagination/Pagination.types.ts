/** Translatable copy for {@link PaginationProps}. */
export type PaginationMessages = {
  /** Accessible name for the navigation landmark. */
  label: string;
  /** Accessible name for the previous-page control. */
  previous: string;
  /** Accessible name for the next-page control. */
  next: string;
  /**
   * Accessible name for a page control. `{page}` is replaced with the number.
   * A bare "3" tells a screen-reader user nothing about what it does.
   */
  page: string;
  /** Accessible name for the current page. `{page}` is replaced with the number. */
  currentPage: string;
};

/**
 * Page navigation for a list that does not fit on one screen.
 *
 * Renders a windowed range with ellipses rather than every page, because a
 * thousand-page dataset would otherwise emit a thousand controls into the
 * accessibility tree.
 *
 * Owns no data and does not fetch — it reports which page was asked for.
 *
 * @tier molecules
 * @tag navigation
 * @tag data-display
 */
export type PaginationProps = {
  /** Current page, 1-based. */
  page: number;
  /** Total number of pages. Renders nothing when there is one page or fewer. */
  pageCount: number;
  /** Called with the requested page number. */
  onValueChange: (page: number) => void;
  /**
   * How many numbered controls to show around the current page, excluding the
   * first, last and ellipses. @default 5
   */
  siblingCount?: number | undefined;
  /**
   * User-facing copy. Defaults are English; pass a translated object to localise.
   * See docs/INTERNATIONALIZATION.md.
   */
  messages?: Partial<PaginationMessages> | undefined;
  /** Scale. @default 'md' */
  size?: 'sm' | 'md' | undefined;
  /** Disables every control — while a page is loading, for instance. @default false */
  isDisabled?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
