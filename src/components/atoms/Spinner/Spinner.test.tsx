import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  /**
   * A silent spinner is invisible to a screen reader — the label is the whole
   * point. It lives as TEXT inside the live region rather than as an `aria-label`
   * because `role="status"` announces its contents when they appear, and a name
   * on an empty region announces nothing.
   */
  it('announces what is being waited for', () => {
    render(<Spinner label="Loading records" />);
    expect(screen.getByRole('status').textContent).toBe('Loading records');
  });

  it('takes its label from the caller, so it can be translated', () => {
    render(<Spinner label="Datensätze werden geladen" />);
    expect(screen.getByRole('status').textContent).toBe('Datensätze werden geladen');
  });

  /**
   * A continuously rotating element is a vestibular trigger. `motion-safe:` is
   * how the animation respects `prefers-reduced-motion`.
   */
  it('gates the rotation behind prefers-reduced-motion', () => {
    render(<Spinner testId="spinner" />);
    const ring = screen.getByTestId('spinner').querySelector('[aria-hidden]');
    expect(ring?.className).toContain('motion-safe:animate-spin');
  });
});
