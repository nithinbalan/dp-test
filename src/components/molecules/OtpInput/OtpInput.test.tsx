import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OtpInput } from './OtpInput';

describe('OtpInput', () => {
  it('renders one cell per digit of length', () => {
    render(<OtpInput length={6} value="" onValueChange={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Verification code' })).toBeDefined();
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('advances focus and reports the composed code as digits are typed', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<OtpInput length={4} value="" onValueChange={onValueChange} />);
    const cell1 = screen.getByLabelText('Digit 1 of 4');
    const cell2 = screen.getByLabelText('Digit 2 of 4');

    fireEvent.change(cell1, { target: { value: '1' } });
    expect(onValueChange).toHaveBeenCalledWith('1');
    expect(document.activeElement).toBe(cell2);

    rerender(<OtpInput length={4} value="1" onValueChange={onValueChange} />);
    fireEvent.change(cell2, { target: { value: '2' } });
    expect(onValueChange).toHaveBeenCalledWith('12');
  });

  it('moves focus back on backspace from an empty cell', () => {
    render(<OtpInput length={4} value="12" onValueChange={vi.fn()} />);
    const cell2 = screen.getByLabelText('Digit 2 of 4');
    const cell3 = screen.getByLabelText('Digit 3 of 4');
    cell3.focus();
    fireEvent.keyDown(cell3, { key: 'Backspace' });
    expect(document.activeElement).toBe(cell2);
  });

  it('splits a pasted code across all cells', () => {
    const onValueChange = vi.fn();
    render(<OtpInput length={6} value="" onValueChange={onValueChange} />);
    const cell1 = screen.getByLabelText('Digit 1 of 6');

    const clipboardData = { getData: () => '123456' };
    fireEvent.paste(cell1, { clipboardData });
    expect(onValueChange).toHaveBeenCalledWith('123456');
  });

  it('shows an error message and marks cells invalid', () => {
    render(<OtpInput value="" onValueChange={vi.fn()} errorMessage="That code has expired." />);
    expect(screen.getByRole('alert').textContent).toBe('That code has expired.');
    expect(screen.getByLabelText('Digit 1 of 6').getAttribute('aria-invalid')).toBe('true');
  });
});
