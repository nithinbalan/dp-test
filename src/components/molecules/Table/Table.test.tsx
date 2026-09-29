import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table } from './Table';

const renderTable = (props: Partial<React.ComponentProps<typeof Table>> = {}) =>
  render(
    <Table label="Processing records" {...props}>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell sortDirection="ascending">Record</Table.HeaderCell>
          <Table.HeaderCell align="end">Artefacts</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row testId="row-1" isSelected>
          <Table.Cell>Payroll</Table.Cell>
          <Table.Cell align="end">12</Table.Cell>
        </Table.Row>
        <Table.Row testId="row-2" isDisabled>
          <Table.Cell>CCTV</Table.Cell>
          <Table.Cell align="end">3</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>,
  );

describe('Table', () => {
  /**
   * The point of not building this out of CSS grid: real table semantics give a
   * screen reader row and column relationships, which a grid cannot express.
   */
  it('exposes real table semantics', () => {
    renderTable();
    expect(screen.getByRole('table', { name: 'Processing records' })).toBeDefined();
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
  });

  it('names the table from a caption that stays in the accessibility tree', () => {
    renderTable();
    // `sr-only`, not `hidden` — a hidden caption would take the name with it.
    expect(screen.getByText('Processing records').className).toContain('sr-only');
  });

  it('shows the caption when asked, without changing the accessible name', () => {
    renderTable({ isLabelVisible: true });
    expect(screen.getByText('Processing records').className).not.toContain('sr-only');
    expect(screen.getByRole('table', { name: 'Processing records' })).toBeDefined();
  });

  it('reports selection and disabled state as attributes, not only as colour', () => {
    renderTable();
    expect(screen.getByTestId('row-1').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('row-2').getAttribute('aria-disabled')).toBe('true');
  });

  /** A rotated chevron communicates sort order to sighted users only. */
  it('reports sort direction through aria-sort', () => {
    renderTable();
    expect(screen.getAllByRole('columnheader')[0]?.getAttribute('aria-sort')).toBe('ascending');
  });

  it('gives every header cell an explicit scope', () => {
    renderTable();
    for (const header of screen.getAllByRole('columnheader')) {
      expect(header.getAttribute('scope')).toBe('col');
    }
  });

  it('aligns with logical properties, so numeric columns flip in Arabic', () => {
    renderTable();
    const numeric = screen.getAllByRole('cell')[1];
    expect(numeric?.className).toContain('text-end');
    expect(numeric?.className).not.toContain('text-right');
  });

  it('sets density once on the table rather than per cell', () => {
    renderTable({ size: 'sm' });
    expect(screen.getByRole('table').className).toContain('[&_td]:py-1.5');
  });
});
