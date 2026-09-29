import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from './Progress';

describe('Progress', () => {
  it('exposes the range to assistive technology', () => {
    render(<Progress value={64} label="Readiness score" />);
    const bar = screen.getByRole('progressbar', { name: 'Readiness score' });
    expect(bar.getAttribute('aria-valuenow')).toBe('64');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  /** Bad data should look like bad data, not like a broken layout. */
  it('clamps a value outside the range instead of overflowing the track', () => {
    const { rerender } = render(<Progress testId="progress" value={220} />);
    expect(screen.getByTestId('progress').getAttribute('aria-valuenow')).toBe('100');
    rerender(<Progress testId="progress" value={-20} />);
    expect(screen.getByTestId('progress').getAttribute('aria-valuenow')).toBe('0');
  });

  it('scales against a custom max', () => {
    render(<Progress testId="progress" value={18} max={24} />);
    const bar = screen.getByTestId('progress');
    expect(bar.getAttribute('aria-valuemax')).toBe('24');
    expect(bar.getAttribute('aria-valuenow')).toBe('18');
  });

  it('prefers a human-readable value over the raw percentage', () => {
    render(<Progress value={18} max={24} valueLabel="18 of 24 records mapped" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe(
      '18 of 24 records mapped',
    );
  });

  /**
   * `inlineSize` fills from the right in Arabic; `width` would fill from the left
   * in both directions and quietly look wrong in one of them.
   */
  it('sizes the fill along the logical axis', () => {
    render(<Progress testId="progress" value={50} />);
    const fill = screen.getByTestId('progress').firstElementChild;
    expect(fill?.getAttribute('style')).toContain('inline-size');
  });
});
