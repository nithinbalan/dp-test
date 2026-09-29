import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

const VARIANTS = ['solid', 'soft', 'outline'] as const;
const TONES = ['neutral', 'brand', 'accent', 'success', 'warning', 'danger', 'info'] as const;

describe('Badge', () => {
  it('renders its content', () => {
    render(<Badge testId="badge">Open</Badge>);
    expect(screen.getByTestId('badge').textContent).toBe('Open');
  });

  it('is not focusable or interactive — a toggleable badge is a Chip', () => {
    render(<Badge testId="badge">Open</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.hasAttribute('tabindex')).toBe(false);
  });

  it('renders slots around the content in logical order', () => {
    render(
      <Badge
        testId="badge"
        startSlot={<span data-testid="start">A</span>}
        endSlot={<span data-testid="end">Z</span>}
      >
        Open
      </Badge>,
    );
    const order = [...screen.getByTestId('badge').childNodes];
    expect(order.indexOf(screen.getByTestId('start'))).toBeLessThan(
      order.indexOf(screen.getByTestId('end')),
    );
  });

  describe('in RTL', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('dir');
    });

    it('uses no physical direction utilities in any variant', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      const physical =
        /(^|\s)-?(ml|mr|pl|pr)-|(^|\s)-?(left|right)-|(^|\s)text-(left|right)(\s|$)|(^|\s)border-[lr](-|\s|$)|(^|\s)rounded-(l|r|tl|tr|bl|br)(-|\s|$)/;

      for (const variant of VARIANTS) {
        for (const tone of TONES) {
          const { unmount } = render(
            <Badge testId="badge" variant={variant} tone={tone}>
              Open
            </Badge>,
          );
          const className = screen.getByTestId('badge').className;
          expect(physical.test(className), `${variant}/${tone}: "${className}"`).toBe(false);
          unmount();
        }
      }
    });
  });
});
