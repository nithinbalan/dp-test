import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('announces the person, not the glyphs', () => {
    render(<Avatar label="Ajmal Faiz" initials="AF" />);
    const avatar = screen.getByRole('img', { name: 'Ajmal Faiz' });
    // The initials are decorative: the label above already names this element, so
    // reading "AF" as well would announce the same person twice.
    expect(avatar.querySelector('[aria-hidden]')?.textContent).toBe('AF');
  });

  it('prefers a supplied image over the initials fallback', () => {
    render(
      <Avatar
        label="Ajmal Faiz"
        initials="AF"
        imageSlot={<span data-testid="image">image</span>}
      />,
    );
    expect(screen.getByTestId('image')).toBeDefined();
    expect(screen.getByRole('img', { name: 'Ajmal Faiz' }).textContent).toBe('image');
  });

  it('still has an accessible name with no initials and no image', () => {
    render(<Avatar label="Unassigned" />);
    expect(screen.getByRole('img', { name: 'Unassigned' })).toBeDefined();
  });

  it('uses no physical direction utilities', () => {
    const physical = /(^|\s)-?(ml|mr|pl|pr)-|(^|\s)-?(left|right)-|(^|\s)text-(left|right)(\s|$)/;
    render(<Avatar label="Ajmal Faiz" initials="AF" testId="avatar" />);
    expect(physical.test(screen.getByTestId('avatar').className)).toBe(false);
  });
});
