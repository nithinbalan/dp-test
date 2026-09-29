import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Chip } from './Chip';

describe('Chip', () => {
  it('exposes selection through aria-pressed, not colour alone', () => {
    const { rerender } = render(<Chip>Open</Chip>);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
    rerender(<Chip isSelected>Open</Chip>);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
  });

  it('reports the NEXT state, so the caller never has to invert it', () => {
    const onValueChange = vi.fn();
    render(
      <Chip isSelected onValueChange={onValueChange}>
        Open
      </Chip>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('does not toggle while disabled', () => {
    const onValueChange = vi.fn();
    render(
      <Chip isDisabled onValueChange={onValueChange}>
        Open
      </Chip>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('is always type="button" so a chip inside a form cannot submit it', () => {
    render(<Chip>Open</Chip>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });

  describe('in RTL', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('dir');
    });

    it('uses no physical direction utilities in either selection state', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      const physical =
        /(^|\s)-?(ml|mr|pl|pr)-|(^|\s)-?(left|right)-|(^|\s)text-(left|right)(\s|$)|(^|\s)border-[lr](-|\s|$)/;

      for (const isSelected of [false, true]) {
        const { unmount } = render(
          <Chip isSelected={isSelected} tone="brand">
            Open
          </Chip>,
        );
        expect(physical.test(screen.getByRole('button').className)).toBe(false);
        unmount();
      }
    });
  });
});
