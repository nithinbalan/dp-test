import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthShell } from './AuthShell';

describe('AuthShell', () => {
  it('renders both slots', () => {
    render(<AuthShell leftSlot={<span>Brand</span>} rightSlot={<span>Card</span>} />);
    expect(screen.getByText('Brand')).toBeDefined();
    expect(screen.getByText('Card')).toBeDefined();
  });
});
