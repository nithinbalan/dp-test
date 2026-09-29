import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  /**
   * A placeholder vanishes the moment the user types. If it were the only label,
   * the field would become anonymous exactly when it has content worth naming.
   */
  it('is named by an aria-label, not by the placeholder', () => {
    render(<SearchInput value="" onValueChange={() => undefined} />);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeDefined();
  });

  it('reports the query, not the event', () => {
    const onValueChange = vi.fn();
    render(<SearchInput value="" onValueChange={onValueChange} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'payroll' } });
    expect(onValueChange).toHaveBeenCalledWith('payroll');
  });

  /** A clear button on an empty field is a control that does nothing. */
  it('shows the clear control only when there is something to clear', () => {
    const { rerender } = render(<SearchInput value="" onValueChange={() => undefined} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    rerender(<SearchInput value="payroll" onValueChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeDefined();
  });

  it('clears through the same value channel, so the parent stays in control', () => {
    const onValueChange = vi.fn();
    const onClear = vi.fn();
    render(<SearchInput value="payroll" onValueChange={onValueChange} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onValueChange).toHaveBeenCalledWith('');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('takes every string from messages, so the control localises', () => {
    render(
      <SearchInput
        value="Gehalt"
        onValueChange={() => undefined}
        messages={{ label: 'Suchen', clear: 'Zurücksetzen' }}
      />,
    );
    expect(screen.getByRole('searchbox', { name: 'Suchen' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Zurücksetzen' })).toBeDefined();
  });
});
