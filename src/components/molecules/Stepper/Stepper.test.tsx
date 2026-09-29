import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Stepper } from './Stepper';

const steps = [
  { value: 'scope', label: 'Scope' },
  { value: 'data', label: 'Data map' },
  { value: 'basis', label: 'Lawful basis' },
  { value: 'notice', label: 'Notice' },
];

describe('Stepper', () => {
  /** An ordered list is what makes "3 of 4" come out of the browser, not out of us. */
  it('renders an ordered list of steps', () => {
    render(<Stepper steps={steps} activeIndex={2} />);
    expect(screen.getByRole('list', { name: 'Progress' })).toBeDefined();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('marks where the user is standing with aria-current', () => {
    render(<Stepper steps={steps} activeIndex={2} />);
    const current = screen.getAllByRole('listitem').filter((li) => li.getAttribute('aria-current'));
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent).toContain('Lawful basis');
  });

  /** Colour and a tick are the sighted half; these words are the other half. */
  it('states completion and position in words as well as in colour', () => {
    render(<Stepper steps={steps} activeIndex={2} />);
    expect(screen.getAllByText('completed')).toHaveLength(2);
    expect(screen.getAllByText('current step')).toHaveLength(1);
  });

  /**
   * Jumping forward past validation is how a wizard submits a half-finished
   * record, so forward markers are never controls at all.
   */
  it('offers navigation backwards only', () => {
    const onValueChange = vi.fn();
    render(<Stepper steps={steps} activeIndex={2} onValueChange={onValueChange} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Scope', 'Data map']);

    fireEvent.click(screen.getByRole('button', { name: 'Scope' }));
    expect(onValueChange).toHaveBeenCalledWith('scope');
  });

  it('renders no controls at all when navigation is not offered', () => {
    render(<Stepper steps={steps} activeIndex={2} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('takes every string from messages, so the flow localises', () => {
    render(
      <Stepper
        steps={steps}
        activeIndex={1}
        messages={{ label: 'Fortschritt', completed: 'abgeschlossen' }}
      />,
    );
    expect(screen.getByRole('list', { name: 'Fortschritt' })).toBeDefined();
    expect(screen.getByText('abgeschlossen')).toBeDefined();
  });
});
