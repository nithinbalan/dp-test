import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('exposes an accessible name', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toContain('Change theme');
  });

  it('reports the current theme via its title once mounted', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button').getAttribute('title')).toBe('System');
  });

  it('renders translated copy when messages are supplied', () => {
    render(<ThemeToggle messages={{ label: 'تغيير السمة', system: 'النظام' }} />);
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-label')).toBe('تغيير السمة');
    expect(button.getAttribute('title')).toBe('النظام');
  });
});
