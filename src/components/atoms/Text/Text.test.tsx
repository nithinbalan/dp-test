import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';

describe('Text', () => {
  it('renders a paragraph by default', () => {
    render(<Text testId="text">Hello</Text>);
    expect(screen.getByTestId('text').tagName).toBe('P');
  });

  it('renders the element it is told to, so the markup can stay semantically true', () => {
    render(
      <Text as="span" testId="text">
        Hello
      </Text>,
    );
    expect(screen.getByTestId('text').tagName).toBe('SPAN');
  });

  it('applies the mono face only when asked', () => {
    const { rerender } = render(<Text testId="text">Hello</Text>);
    expect(screen.getByTestId('text').className).not.toContain('font-mono');
    rerender(
      <Text testId="text" isMono>
        Hello
      </Text>,
    );
    expect(screen.getByTestId('text').className).toContain('font-mono');
  });

  it('uses no physical direction utilities, so it aligns from the start edge in Arabic', () => {
    const physical = /(^|\s)-?(ml|mr|pl|pr)-|(^|\s)text-(left|right)(\s|$)/;
    render(<Text testId="text">Hello</Text>);
    expect(physical.test(screen.getByTestId('text').className)).toBe(false);
  });
});
