import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TagPicker } from './TagPicker';

const OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'aadhaar', label: 'Aadhaar number', isSensitive: true },
];

describe('TagPicker', () => {
  it('renders every option', () => {
    render(<TagPicker label="Identifiers" options={OPTIONS} value={[]} onValueChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Name' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Aadhaar number' })).toBeDefined();
  });

  it('adds a value when an unselected tag is pressed', () => {
    const onValueChange = vi.fn();
    render(
      <TagPicker label="Identifiers" options={OPTIONS} value={[]} onValueChange={onValueChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(onValueChange).toHaveBeenCalledWith(['name']);
  });

  it('removes a value when a selected tag is pressed', () => {
    const onValueChange = vi.fn();
    render(
      <TagPicker
        label="Identifiers"
        options={OPTIONS}
        value={['name', 'aadhaar']}
        onValueChange={onValueChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(onValueChange).toHaveBeenCalledWith(['aadhaar']);
  });

  it('marks selected tags pressed', () => {
    render(
      <TagPicker
        label="Identifiers"
        options={OPTIONS}
        value={['aadhaar']}
        onValueChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Aadhaar number' }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(screen.getByRole('button', { name: 'Name' }).getAttribute('aria-pressed')).toBe('false');
  });
});
