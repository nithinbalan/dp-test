import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@atoms/Button';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the headline as a heading, so it is reachable by heading navigation', () => {
    render(<EmptyState label="No processing records yet" />);
    expect(screen.getByRole('heading', { name: 'No processing records yet' })).toBeDefined();
  });

  it('renders the description and the action', () => {
    render(
      <EmptyState
        label="No records"
        description="Most organisations start with payroll."
        actionSlot={<Button>Create</Button>}
      />,
    );
    expect(screen.getByText('Most organisations start with payroll.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDefined();
  });

  it('hides the illustration from assistive technology — the headline says it', () => {
    render(<EmptyState testId="empty" label="No records" startSlot={<span>🗂</span>} />);
    expect(screen.getByTestId('empty').querySelector('[aria-hidden]')).not.toBeNull();
  });

  /**
   * A table already draws a border and a radius; nesting a second card inside it
   * is the visual seam that gives away a component reused in the wrong place.
   */
  it('drops its own chrome in the ghost variant', () => {
    const { rerender } = render(<EmptyState testId="empty" label="No records" />);
    expect(screen.getByTestId('empty').className).toContain('border-dashed');
    rerender(<EmptyState testId="empty" label="No records" variant="ghost" />);
    expect(screen.getByTestId('empty').className).not.toContain('border-dashed');
  });

  it('uses no physical direction utilities', () => {
    const physical = /(^|\s)-?(ml|mr|pl|pr)-|(^|\s)-?(left|right)-|(^|\s)text-(left|right)(\s|$)/;
    render(<EmptyState testId="empty" label="No records" description="Detail" />);
    expect(physical.test(screen.getByTestId('empty').innerHTML)).toBe(false);
  });
});
