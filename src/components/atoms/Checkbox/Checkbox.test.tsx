import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('is labelled by its caption, so clicking the text toggles it', () => {
    render(<Checkbox>Send a copy</Checkbox>);
    const checkbox = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Send a copy' });
    fireEvent.click(screen.getByText('Send a copy'));
    expect(checkbox.checked).toBe(true);
  });

  it('reports the NEXT checked state, so the caller never has to invert it', () => {
    const onValueChange = vi.fn();
    render(<Checkbox onValueChange={onValueChange}>Send a copy</Checkbox>);
    fireEvent.click(screen.getByRole<HTMLInputElement>('checkbox'));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  /**
   * `indeterminate` exists only as a DOM property — there is no attribute for it —
   * so it is the one piece of state that a purely declarative render cannot set.
   */
  it('applies indeterminate to the DOM property, and clears it again', () => {
    const { rerender } = render(<Checkbox isIndeterminate>Select all</Checkbox>);
    expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(true);
    rerender(<Checkbox isIndeterminate={false}>Select all</Checkbox>);
    expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(false);
  });

  /**
   * Asserted on the attribute rather than by firing a click: a real browser never
   * delivers a click to a disabled control, but `fireEvent` dispatches the event
   * straight at the node and bypasses that. A passing click-based test here would
   * be measuring jsdom, not the component.
   */
  it('carries the native disabled attribute, which is what blocks interaction', () => {
    render(<Checkbox isDisabled>Send a copy</Checkbox>);
    expect(screen.getByRole<HTMLInputElement>('checkbox').disabled).toBe(true);
  });

  it('exposes invalidity to assistive technology', () => {
    render(<Checkbox isInvalid>Send a copy</Checkbox>);
    expect(screen.getByRole<HTMLInputElement>('checkbox').getAttribute('aria-invalid')).toBe(
      'true',
    );
  });
});
