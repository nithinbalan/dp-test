import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Tabular data, as a real `<table>`.
 *
 * The prototype builds its tables from CSS grid rows, which looks identical and
 * is not the same thing: a grid has no row/column relationships, so a screen
 * reader reads it as a flat run of text with no idea which column a cell is in,
 * and "next column" / "read this row" do nothing. Semantic table elements are
 * what buy that back, and `table-fixed` plus per-cell truncation gets the dense
 * layout back on top of them.
 *
 * Sorting, selection, pagination and virtualisation belong to an organism built
 * ON this — not inside it.
 *
 * @tier molecules
 * @tag data-display
 * @tag table
 */
export type TableProps = Omit<ComponentPropsWithoutRef<'table'>, 'className'> & {
  /**
   * What the table contains, for screen readers. Visually hidden by default.
   * Required: an unnamed table is one of several on a page with no way to tell
   * them apart.
   */
  label: string;
  /** Shows {@link TableProps.label} above the table instead of hiding it. @default false */
  isLabelVisible?: boolean | undefined;
  /** Row density. @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Highlights the row under the pointer. @default true */
  isHoverable?: boolean | undefined;
  /**
   * Pins the header while the body scrolls. Needs a scroll container with a
   * bounded height around the table to do anything. @default false
   */
  isHeaderSticky?: boolean | undefined;
  /** The header, body and footer sections. */
  children?: ReactNode | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};

/** A row. `isSelected` and `isDisabled` are reported to AT, not only painted. */
export type TableRowProps = Omit<ComponentPropsWithoutRef<'tr'>, 'className'> & {
  /** Marks the row selected; sets `aria-selected`. @default false */
  isSelected?: boolean | undefined;
  /** Dims the row and drops its hover affordance. @default false */
  isDisabled?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};

/** A body cell. */
export type TableCellProps = Omit<ComponentPropsWithoutRef<'td'>, 'className' | 'align'> & {
  /** Content alignment. `end` for numbers, so digits line up. @default 'start' */
  align?: 'start' | 'end' | 'center' | undefined;
  /** Clips overflow to one line. Requires the table's fixed layout. @default false */
  isTruncated?: boolean | undefined;
  /** Stops the cell from shrinking below its content. @default false */
  isNowrap?: boolean | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};

/** A header cell. Always renders `<th>` with an explicit scope. */
export type TableHeaderCellProps = Omit<ComponentPropsWithoutRef<'th'>, 'className' | 'align'> & {
  /** Which cells this heads. @default 'col' */
  scope?: 'col' | 'row' | undefined;
  /** Content alignment. @default 'start' */
  align?: 'start' | 'end' | 'center' | undefined;
  /**
   * Current sort direction, when an organism above has made this column
   * sortable. Sets `aria-sort`, which is how a screen reader reports it.
   */
  sortDirection?: 'ascending' | 'descending' | 'none' | undefined;
  /** Merged last, so consumers can override. */
  className?: string | undefined;
  /** Maps to data-testid. */
  testId?: string | undefined;
};
