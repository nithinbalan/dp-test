import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('accepts typed text', () => {
    render(<Input testId="input" />);
    const input = screen.getByTestId<HTMLInputElement>('input');
    fireEvent.change(input, { target: { value: 'Acme' } });
    expect(input.value).toBe('Acme');
  });

  it('exposes invalidity to assistive technology, not just as a colour', () => {
    render(<Input testId="input" isInvalid />);
    expect(screen.getByTestId('input').getAttribute('aria-invalid')).toBe('true');
  });

  it('maps the is-prefixed props onto the native attributes', () => {
    render(<Input testId="input" isRequired isReadOnly isDisabled />);
    const input = screen.getByTestId<HTMLInputElement>('input');
    expect(input.hasAttribute('required')).toBe(true);
    expect(input.hasAttribute('readonly')).toBe(true);
    expect(input.hasAttribute('disabled')).toBe(true);
  });

  it('keeps slots inside the control, so focus still reaches the input', () => {
    render(<Input testId="input" startSlot={<span data-testid="start">S</span>} />);
    const input = screen.getByTestId<HTMLInputElement>('input');
    const start = screen.getByTestId('start');
    expect(input.parentElement?.contains(start)).toBe(true);
  });

  describe('in RTL', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('dir');
    });

    it('uses no physical direction utilities', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      const physical =
        /(^|\s)-?(ml|mr|pl|pr)-|(^|\s)-?(left|right)-|(^|\s)text-(left|right)(\s|$)|(^|\s)border-[lr](-|\s|$)/;
      render(<Input testId="input" startSlot={<span>S</span>} endSlot={<span>E</span>} />);
      const wrapper = screen.getByTestId('input').parentElement;
      expect(physical.test(wrapper?.className ?? '')).toBe(false);
    });
  });
});
