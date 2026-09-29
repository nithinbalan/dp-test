import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders a div by default', () => {
    render(<Card testId="card">Body</Card>);
    expect(screen.getByTestId('card').tagName).toBe('DIV');
  });

  it('renders the element it is told to, so a region can be a real landmark', () => {
    render(
      <Card as="section" aria-label="Records" testId="card">
        Body
      </Card>,
    );
    expect(screen.getByRole('region', { name: 'Records' })).toBeDefined();
  });

  /**
   * The card is chrome. If `isInteractive` implied a click handler here, keyboard
   * users would be left with an unreachable target — which is the exact bug the
   * prop is documented against.
   */
  it('adds affordances but no interactivity of its own', () => {
    render(
      <Card isInteractive testId="card">
        Body
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card.hasAttribute('tabindex')).toBe(false);
    expect(card.className).toContain('focus-within:border-brand-solid');
  });

  it('drops its padding entirely at size="none", so a table can meet the edges', () => {
    render(
      <Card size="none" testId="card">
        Body
      </Card>,
    );
    expect(/(^|\s)p-\d/.test(screen.getByTestId('card').className)).toBe(false);
  });

  it('ships no external margins', () => {
    render(<Card testId="card">Body</Card>);
    expect(/(^|\s)-?m[trblxyse]?-/.test(screen.getByTestId('card').className)).toBe(false);
  });
});
