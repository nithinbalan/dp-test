import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Link } from './Link';

describe('Link', () => {
  it('renders an anchor to the given href', () => {
    render(<Link href="/records">Records</Link>);
    expect(screen.getByRole('link', { name: 'Records' }).getAttribute('href')).toBe('/records');
  });

  /**
   * Without `noopener` the opened page can navigate this one through
   * `window.opener`. It is one attribute and it is never optional.
   */
  it('closes the window.opener hole on external links', () => {
    render(
      <Link href="https://example.com" isExternal>
        External
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('warns screen-reader users about the new tab, in their language', () => {
    render(
      <Link href="https://example.com" isExternal externalLabel="öffnet in einem neuen Tab">
        Extern
      </Link>,
    );
    expect(screen.getByText('öffnet in einem neuen Tab')).toBeDefined();
  });

  it('adds no target or rel to an internal link', () => {
    render(<Link href="/records">Records</Link>);
    const link = screen.getByRole('link');
    expect(link.hasAttribute('target')).toBe(false);
    expect(link.hasAttribute('rel')).toBe(false);
  });
});
