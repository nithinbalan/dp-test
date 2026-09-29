import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LocaleSwitcher } from './LocaleSwitcher';

describe('LocaleSwitcher', () => {
  it('lists every supported locale in its native script', () => {
    render(<LocaleSwitcher current="en" label="Change language" />);
    expect(screen.getByRole('option', { name: 'English' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'العربية' })).toBeDefined();
    expect(screen.getByRole('option', { name: 'Deutsch' })).toBeDefined();
  });

  it('marks each option with its own lang and dir', () => {
    render(<LocaleSwitcher current="en" label="Change language" />);
    const arabic = screen.getByRole('option', { name: 'العربية' });
    expect(arabic.getAttribute('lang')).toBe('ar');
    expect(arabic.getAttribute('dir')).toBe('rtl');
  });

  it('reports the chosen locale', () => {
    const onValueChange = vi.fn();
    render(<LocaleSwitcher current="en" label="Change language" onValueChange={onValueChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'de' } });
    expect(onValueChange).toHaveBeenCalledWith('de');
  });
});
