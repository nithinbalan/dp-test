import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  /**
   * The reason this component exists. An icon-only control with no name is
   * unusable with a screen reader, and nothing in a visual review reveals it.
   */
  it('is named by `label`, not by the glyph', () => {
    render(
      <IconButton label="Delete record">
        <svg />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Delete record' })).toBeDefined();
  });

  it('hides the glyph from assistive technology, so the name is announced once', () => {
    render(
      <IconButton label="Delete record" testId="button">
        <span>x</span>
      </IconButton>,
    );
    expect(screen.getByTestId('button').querySelector('[aria-hidden]')).not.toBeNull();
  });

  it('defaults to type="button" so it never submits a surrounding form', () => {
    render(<IconButton label="Close" />);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });

  it('does not fire while disabled', () => {
    const onClick = vi.fn();
    render(<IconButton label="Close" isDisabled onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
