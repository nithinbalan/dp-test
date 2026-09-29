import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Divider } from './Divider';

describe('Divider', () => {
  /** A bordered div divides the page for sighted users only. */
  it('is a real separator, so the break exists for screen-reader users too', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).toBeDefined();
  });

  it('reports its axis', () => {
    render(<Divider orientation="vertical" />);
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('vertical');
  });

  /**
   * With a caption, the caption is the boundary marker — announcing "separator"
   * on top of it would report the same break twice.
   */
  it('steps back to presentational when it carries a caption', () => {
    render(<Divider testId="divider">Retention</Divider>);
    expect(screen.queryByRole('separator')).toBeNull();
    expect(screen.getByText('Retention')).toBeDefined();
  });

  it('ships no margins of its own', () => {
    render(<Divider testId="divider" />);
    expect(/(^|\s)-?m[trblxyse]?-/.test(screen.getByTestId('divider').className)).toBe(false);
  });
});
