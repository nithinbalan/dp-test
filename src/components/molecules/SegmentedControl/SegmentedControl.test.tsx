import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SegmentedControl } from './SegmentedControl';

const items = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Assigned to me' },
  { value: 'archived', label: 'Archived', isDisabled: true },
];

const renderControl = (props: Partial<React.ComponentProps<typeof SegmentedControl>> = {}) =>
  render(
    <SegmentedControl
      label="Filter records by"
      items={items}
      value="all"
      onValueChange={() => undefined}
      {...props}
    />,
  );

describe('SegmentedControl', () => {
  /**
   * The reason this is built on radios: a radiogroup gets arrow-key movement, one
   * tab stop and "2 of 3" announcements from the browser. A row of aria-pressed
   * buttons gets none of them.
   */
  it('is a radiogroup, not a row of toggle buttons', () => {
    renderControl();
    expect(screen.getByRole('radiogroup', { name: 'Filter records by' })).toBeDefined();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marks exactly one segment as chosen', () => {
    renderControl({ value: 'mine' });
    const chosen = screen.getAllByRole<HTMLInputElement>('radio').filter((r) => r.checked);
    expect(chosen).toHaveLength(1);
    expect(chosen[0]?.value).toBe('mine');
  });

  it('reports the chosen value, not the event', () => {
    const onValueChange = vi.fn();
    renderControl({ onValueChange });
    fireEvent.click(screen.getByRole('radio', { name: 'Assigned to me' }));
    expect(onValueChange).toHaveBeenCalledWith('mine');
  });

  it('honours a per-segment disabled flag', () => {
    renderControl();
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Archived' }).disabled).toBe(true);
  });

  it('disables every segment when the whole control is disabled', () => {
    renderControl({ isDisabled: true });
    for (const radio of screen.getAllByRole<HTMLInputElement>('radio')) {
      expect(radio.disabled).toBe(true);
    }
  });

  /** Hiding the input any harder would remove the behaviour it exists to provide. */
  it('keeps the inputs focusable rather than hiding them from the browser', () => {
    renderControl();
    const radio = screen.getByRole('radio', { name: 'All' });
    expect(radio.className).toContain('sr-only');
    expect(radio.hasAttribute('hidden')).toBe(false);
  });
});
