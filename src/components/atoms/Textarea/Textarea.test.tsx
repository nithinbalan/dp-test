import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('accepts typed text', () => {
    render(<Textarea testId="textarea" />);
    const textarea = screen.getByTestId<HTMLTextAreaElement>('textarea');
    fireEvent.change(textarea, { target: { value: 'Purpose' } });
    expect(textarea.value).toBe('Purpose');
  });

  it('exposes invalidity to assistive technology, not just as a colour', () => {
    render(<Textarea testId="textarea" isInvalid />);
    expect(screen.getByTestId('textarea').getAttribute('aria-invalid')).toBe('true');
  });

  /**
   * Horizontal resize lets a user drag the control past the edge of the form and
   * there is no way back without reloading — so the axis is constrained, always.
   */
  it('never resizes horizontally', () => {
    const { rerender } = render(<Textarea testId="textarea" />);
    expect(screen.getByTestId('textarea').className).toContain('resize-y');
    rerender(<Textarea testId="textarea" isResizable={false} />);
    expect(screen.getByTestId('textarea').className).toContain('resize-none');
  });

  it('maps the is-prefixed props onto the native attributes', () => {
    render(<Textarea testId="textarea" isRequired isReadOnly isDisabled />);
    const textarea = screen.getByTestId<HTMLTextAreaElement>('textarea');
    expect(textarea.hasAttribute('required')).toBe(true);
    expect(textarea.hasAttribute('readonly')).toBe(true);
    expect(textarea.hasAttribute('disabled')).toBe(true);
  });
});
