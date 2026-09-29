import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Radio } from './Radio';

describe('Radio', () => {
  it('is labelled by its caption, so clicking the text selects it', () => {
    render(
      <Radio name="basis" value="consent">
        Consent
      </Radio>,
    );
    fireEvent.click(screen.getByText('Consent'));
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Consent' }).checked).toBe(true);
  });

  it('reports the selected value, so the caller never reads event.target', () => {
    const onValueChange = vi.fn();
    render(
      <Radio name="basis" value="contract" onValueChange={onValueChange}>
        Contract
      </Radio>,
    );
    fireEvent.click(screen.getByRole<HTMLInputElement>('radio'));
    expect(onValueChange).toHaveBeenCalledWith('contract');
  });

  /** The browser enforces exclusivity from `name` — this proves we did not break it. */
  it('deselects its siblings in the same name group', () => {
    render(
      <>
        <Radio name="basis" value="a" defaultChecked>
          A
        </Radio>
        <Radio name="basis" value="b">
          B
        </Radio>
      </>,
    );
    fireEvent.click(screen.getByRole<HTMLInputElement>('radio', { name: 'B' }));
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'A' }).checked).toBe(false);
  });

  /**
   * Asserted on the attribute rather than by firing a click: a real browser never
   * delivers a click to a disabled control, but `fireEvent` dispatches the event
   * straight at the node and bypasses that. A passing click-based test here would
   * be measuring jsdom, not the component.
   */
  it('carries the native disabled attribute, which is what blocks interaction', () => {
    render(
      <Radio name="basis" value="a" isDisabled>
        A
      </Radio>,
    );
    expect(screen.getByRole<HTMLInputElement>('radio').disabled).toBe(true);
  });
});
