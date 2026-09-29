import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heading } from './Heading';

describe('Heading', () => {
  it('defaults to h2 — a page supplies its own h1', () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole('heading', { level: 2 })).toBeDefined();
  });

  it('renders the requested outline level', () => {
    render(<Heading level={4}>Title</Heading>);
    expect(screen.getByRole('heading', { level: 4 })).toBeDefined();
  });

  /**
   * The whole reason `level` and `size` are separate props: shrinking a heading
   * must not demote it in the document outline, because that is what screen-reader
   * users navigate by.
   */
  it('keeps the outline level when the visual size is overridden', () => {
    render(
      <Heading level={2} size="sm" testId="heading">
        Title
      </Heading>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeDefined();
    expect(screen.getByTestId('heading').className).toContain('text-sm');
  });

  it('uses no physical direction utilities', () => {
    const physical = /(^|\s)-?(ml|mr|pl|pr)-|(^|\s)text-(left|right)(\s|$)/;
    render(<Heading testId="heading">Title</Heading>);
    expect(physical.test(screen.getByTestId('heading').className)).toBe(false);
  });
});
