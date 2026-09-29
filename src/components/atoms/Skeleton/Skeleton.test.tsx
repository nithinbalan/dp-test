import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  /**
   * A screen reader should hear the region's busy state, not a description of the
   * grey boxes standing in for content.
   */
  it('is hidden from assistive technology', () => {
    render(<Skeleton testId="skeleton" />);
    expect(screen.getByTestId('skeleton').getAttribute('aria-hidden')).toBe('true');
  });

  it('renders one block per line', () => {
    render(<Skeleton testId="skeleton" lines={3} />);
    expect(screen.getByTestId('skeleton').children).toHaveLength(3);
  });

  it('gates the shimmer behind prefers-reduced-motion, and can drop it entirely', () => {
    const { rerender } = render(<Skeleton testId="skeleton" />);
    expect(screen.getByTestId('skeleton').innerHTML).toContain('motion-safe:animate-pulse');
    rerender(<Skeleton testId="skeleton" isAnimated={false} />);
    expect(screen.getByTestId('skeleton').innerHTML).not.toContain('animate-pulse');
  });
});
