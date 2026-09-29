import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

const VARIANTS = ['solid', 'soft', 'outline', 'ghost', 'link'] as const;
const TONES = ['neutral', 'brand', 'accent', 'success', 'warning', 'danger', 'info'] as const;

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
  });

  it('blocks interaction while loading', () => {
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('hides the start slot while loading, so the spinner does not sit beside an icon', () => {
    render(
      <Button isLoading startSlot={<span data-testid="start">A</span>}>
        Save
      </Button>,
    );
    expect(screen.queryByTestId('start')).toBeNull();
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });

  describe('asChild', () => {
    it('renders the child element instead of a <button>, styled the same way', () => {
      render(
        <Button asChild tone="brand">
          <a href="/next">Continue</a>
        </Button>,
      );
      const link = screen.getByRole('link', { name: 'Continue' });
      expect(link.tagName).toBe('A');
      expect(link.getAttribute('href')).toBe('/next');
      expect(link.className).toContain('bg-brand-solid');
    });

    it("composes the child element's own onClick with any handler passed to Button", () => {
      const buttonOnClick = vi.fn();
      const childOnClick = vi.fn();
      render(
        <Button asChild onClick={buttonOnClick}>
          <a href="/next" onClick={childOnClick}>
            Continue
          </a>
        </Button>,
      );
      screen.getByRole('link').click();
      expect(buttonOnClick).toHaveBeenCalledTimes(1);
      expect(childOnClick).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * RTL coverage lives HERE, in the component's own test file — not in a sibling
   * `.rtl.test.tsx`. RTL is a property of the same component under a different
   * `dir`, not a different feature; a separate file just splits one component's
   * coverage across two places someone has to remember to open together.
   * See "Writing tests" in src/components/CLAUDE.md.
   *
   * These check the CONTRACT that makes RTL work — slots are ordered logically and
   * nothing pins content to a physical side. They deliberately do not assert
   * computed pixel positions: jsdom does not lay out, and a test that pretends to
   * measure layout gives false confidence.
   */
  describe('in RTL', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('dir');
    });

    it('renders start and end slots in logical order, so direction flips them', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      render(
        <Button
          startSlot={<span data-testid="start">A</span>}
          endSlot={<span data-testid="end">Z</span>}
        >
          Label
        </Button>,
      );

      const button = screen.getByRole('button');
      const start = screen.getByTestId('start');
      const end = screen.getByTestId('end');

      // DOM order is start -> label -> end in BOTH directions. The browser reverses
      // the visual order from `dir`; if a component hardcoded sides, this order
      // would have to change per direction — which is exactly the bug being
      // prevented.
      const order = [...button.childNodes];
      expect(order.indexOf(start)).toBeLessThan(order.indexOf(end));
    });

    it('uses no physical direction utilities in any variant', () => {
      const physical =
        /(^|\s)-?(ml|mr|pl|pr)-|(^|\s)-?(left|right)-|(^|\s)text-(left|right)(\s|$)|(^|\s)border-[lr](-|\s|$)|(^|\s)rounded-(l|r|tl|tr|bl|br)(-|\s|$)|(^|\s)float-(left|right)(\s|$)/;

      for (const variant of VARIANTS) {
        for (const tone of TONES) {
          const { container, unmount } = render(
            <Button variant={variant} tone={tone}>
              Label
            </Button>,
          );
          const className = container.querySelector('button')?.className ?? '';
          expect(physical.test(className), `${variant}/${tone}: "${className}"`).toBe(false);
          unmount();
        }
      }
    });
  });
});
