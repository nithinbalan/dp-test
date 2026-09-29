import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Switch } from './Switch';

describe('Switch', () => {
  it('is announced as a switch with an on/off state, not as a pressed button', () => {
    const { rerender } = render(<Switch>Notify the DPO</Switch>);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
    rerender(<Switch isSelected>Notify the DPO</Switch>);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('takes its accessible name from the caption beside it', () => {
    render(<Switch>Notify the DPO</Switch>);
    expect(screen.getByRole('switch', { name: 'Notify the DPO' })).toBeDefined();
  });

  it('reports the NEXT state, so the caller never has to invert it', () => {
    const onValueChange = vi.fn();
    render(
      <Switch isSelected onValueChange={onValueChange}>
        Notify
      </Switch>,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('does not toggle while disabled', () => {
    const onValueChange = vi.fn();
    render(
      <Switch isDisabled onValueChange={onValueChange}>
        Notify
      </Switch>,
    );
    fireEvent.click(screen.getByRole('switch'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  /**
   * The thumb travels with `justify-*`, which resolves against `dir`. A
   * `translate-x` would slide it the wrong way in Arabic, and no English-language
   * review would catch it.
   */
  it('moves the thumb along the logical axis, not a physical one', () => {
    render(
      <Switch isSelected testId="switch">
        Notify
      </Switch>,
    );
    const className = screen.getByTestId('switch').className;
    expect(className).toContain('justify-end');
    expect(className.includes('translate-x')).toBe(false);
  });
});
