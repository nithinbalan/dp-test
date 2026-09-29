import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Alert } from './Alert';

describe('Alert', () => {
  it('renders the headline and the detail', () => {
    render(<Alert label="Missing lawful basis" description="Three records affected." />);
    expect(screen.getByText('Missing lawful basis')).toBeDefined();
    expect(screen.getByText('Three records affected.')).toBeDefined();
  });

  /**
   * The urgency comes from the same prop as the colour, so a red alert cannot be
   * announced politely and a success note cannot interrupt.
   */
  it('interrupts for danger and warning, and waits its turn otherwise', () => {
    const { rerender } = render(<Alert label="Failed" tone="danger" />);
    expect(screen.getByRole('alert')).toBeDefined();

    rerender(<Alert label="Saved" tone="success" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('shows a dismiss control only when there is something to dismiss', () => {
    const { rerender } = render(<Alert label="Saved" />);
    expect(screen.queryByRole('button')).toBeNull();

    const onDismiss = vi.fn();
    rerender(<Alert label="Saved" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('takes the dismiss control name from the caller, so it can be translated', () => {
    render(<Alert label="Gespeichert" onDismiss={() => undefined} dismissLabel="Schließen" />);
    expect(screen.getByRole('button', { name: 'Schließen' })).toBeDefined();
  });

  it('uses no physical direction utilities in any tone', () => {
    const physical =
      /(^|\s)-?(ml|mr|pl|pr)-|(^|\s)-?(left|right)-|(^|\s)text-(left|right)(\s|$)|(^|\s)border-[lr](-|\s|$)/;
    for (const tone of ['info', 'success', 'warning', 'danger', 'brand', 'neutral'] as const) {
      const { unmount } = render(<Alert testId="alert" label="Message" tone={tone} />);
      expect(physical.test(screen.getByTestId('alert').className), tone).toBe(false);
      unmount();
    }
  });
});
