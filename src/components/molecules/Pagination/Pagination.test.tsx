import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('is a named navigation landmark', () => {
    render(<Pagination page={1} pageCount={5} onValueChange={() => undefined} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeDefined();
  });

  /** Disabled arrows over a single-page table are chrome that says nothing. */
  it('renders nothing when there is only one page', () => {
    const { container } = render(
      <Pagination page={1} pageCount={1} onValueChange={() => undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('marks the current page with aria-current, not only with a fill', () => {
    render(<Pagination page={3} pageCount={5} onValueChange={() => undefined} />);
    expect(screen.getByRole('button', { current: 'page' }).textContent).toBe('3');
  });

  it('names each control by what it does, not by its digit alone', () => {
    render(<Pagination page={1} pageCount={5} onValueChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Page 1, current page' })).toBeDefined();
  });

  it('reports the requested page', () => {
    const onValueChange = vi.fn();
    render(<Pagination page={1} pageCount={5} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onValueChange).toHaveBeenCalledWith(3);
  });

  it('moves one page at a time with the arrows', () => {
    const onValueChange = vi.fn();
    render(<Pagination page={3} pageCount={5} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onValueChange).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onValueChange).toHaveBeenCalledWith(4);
  });

  it('cannot step off either end', () => {
    const { rerender } = render(
      <Pagination page={1} pageCount={5} onValueChange={() => undefined} />,
    );
    expect(screen.getByRole('button', { name: 'Previous page' }).hasAttribute('disabled')).toBe(
      true,
    );
    rerender(<Pagination page={5} pageCount={5} onValueChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Next page' }).hasAttribute('disabled')).toBe(true);
  });

  /**
   * A thousand pages must not become a thousand controls — the accessibility tree
   * is the thing that suffers first, long before the DOM does.
   */
  it('windows the range and always keeps the first and last page reachable', () => {
    render(<Pagination page={500} pageCount={1000} onValueChange={() => undefined} />);
    const numbered = screen
      .getAllByRole('button')
      .filter((button) => /^\d+$/.test(button.textContent));
    expect(numbered.length).toBeLessThan(12);
    expect(numbered.at(0)?.textContent).toBe('1');
    expect(numbered.at(-1)?.textContent).toBe('1000');
  });

  it('takes every string from messages, so the control localises', () => {
    render(
      <Pagination
        page={1}
        pageCount={5}
        onValueChange={() => undefined}
        messages={{ label: 'Seitennavigation', next: 'Nächste Seite' }}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Seitennavigation' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Nächste Seite' })).toBeDefined();
  });
});
