/**
 * @tier molecules
 *
 * Semantic table with the design system's chrome. The sub-components hang off
 * `Table` (`Table.Row`, `Table.Cell`, …) so a caller imports one name and cannot
 * assemble a table out of mismatched parts.
 *
 * Density, hover and stickiness are declared ONCE on the root and reach the cells
 * through descendant variants. The alternative — a `size` prop on every cell, or
 * a context provider — either lets a `sm` header sit above `lg` rows, or makes an
 * otherwise static table a client component for no other reason.
 */
import type { ComponentProps } from 'react';
import { cn } from '@shared/lib';
import type {
  TableCellProps,
  TableHeaderCellProps,
  TableProps,
  TableRowProps,
} from './Table.types';

const densities = {
  sm: '[&_th]:px-3 [&_th]:py-1.5 [&_td]:px-3 [&_td]:py-1.5',
  md: '[&_th]:px-4 [&_th]:py-2.5 [&_td]:px-4 [&_td]:py-2.5',
  lg: '[&_th]:px-4 [&_th]:py-3.5 [&_td]:px-4 [&_td]:py-3.5',
} as const;

const alignments = {
  start: 'text-start',
  end: 'text-end',
  center: 'text-center',
} as const;

function TableRoot({
  label,
  isLabelVisible = false,
  size = 'md',
  isHoverable = true,
  isHeaderSticky = false,
  className,
  testId,
  children,
  ...rest
}: TableProps) {
  return (
    <table
      {...rest}
      data-testid={testId}
      className={cn(
        // `table-fixed` is what lets a cell truncate at all: under `auto` layout
        // the column simply grows and pushes the table past its container.
        'w-full table-fixed border-collapse text-sm',
        densities[size],
        isHoverable && '[&_tbody_tr:hover]:bg-bg-hover',
        isHeaderSticky && '[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10',
        className,
      )}
    >
      <caption
        className={cn(
          isLabelVisible
            ? 'text-fg-muted px-4 py-2 text-start text-xs'
            : // `sr-only`, not `hidden`: a hidden caption leaves the accessibility
              // tree as well, which is the opposite of what a caption is for.
              'sr-only',
        )}
      >
        {label}
      </caption>
      {children}
    </table>
  );
}

function TableHeader({ className, children, ...rest }: ComponentProps<'thead'>) {
  return (
    <thead
      {...rest}
      className={cn(
        // A tint distinct from both the page canvas and the row surface below —
        // `bg-bg-canvas` is literally the page background, so a header using it
        // reads as "no header" rather than a header.
        'bg-bg-hover text-fg-subtle text-2xs font-mono tracking-widest uppercase',
        className,
      )}
    >
      {children}
    </thead>
  );
}

function TableBody({ className, children, ...rest }: ComponentProps<'tbody'>) {
  return (
    <tbody {...rest} className={className}>
      {children}
    </tbody>
  );
}

function TableFooter({ className, children, ...rest }: ComponentProps<'tfoot'>) {
  return (
    <tfoot
      {...rest}
      className={cn('bg-bg-hover border-border-default border-t text-xs', className)}
    >
      {children}
    </tfoot>
  );
}

function TableRow({
  isSelected = false,
  isDisabled = false,
  className,
  testId,
  children,
  ...rest
}: TableRowProps) {
  return (
    <tr
      {...rest}
      aria-selected={isSelected || undefined}
      aria-disabled={isDisabled || undefined}
      data-testid={testId}
      className={cn(
        'border-border-default border-b last:border-b-0',
        isSelected && 'bg-brand-subtle',
        isDisabled && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {children}
    </tr>
  );
}

function TableCell({
  align = 'start',
  isTruncated = false,
  isNowrap = false,
  className,
  testId,
  children,
  ...rest
}: TableCellProps) {
  return (
    <td
      {...rest}
      data-testid={testId}
      className={cn(
        'text-fg-default align-middle',
        alignments[align],
        isTruncated && 'truncate',
        isNowrap && 'whitespace-nowrap',
        className,
      )}
    >
      {children}
    </td>
  );
}

function TableHeaderCell({
  scope = 'col',
  align = 'start',
  sortDirection,
  className,
  testId,
  children,
  ...rest
}: TableHeaderCellProps) {
  return (
    <th
      {...rest}
      scope={scope}
      // `aria-sort` is how the sort state reaches a screen reader. A rotated
      // chevron reaches nobody.
      aria-sort={sortDirection}
      data-testid={testId}
      className={cn('border-border-default border-b font-medium', alignments[align], className)}
    >
      {children}
    </th>
  );
}

/** Sub-components hang off the root so one import gets a matching set. */
export const Table = Object.assign(TableRoot, {
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  Cell: TableCell,
  HeaderCell: TableHeaderCell,
});
