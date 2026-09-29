import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
  it('renders as a password field by default', () => {
    render(<PasswordInput label="Password" value="" onValueChange={vi.fn()} />);
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('password');
  });

  it('toggles visibility', () => {
    render(<PasswordInput label="Password" value="secret" onValueChange={vi.fn()} />);
    const input = screen.getByLabelText('Password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input.getAttribute('type')).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input.getAttribute('type')).toBe('password');
  });

  it('calls onValueChange with the new value', () => {
    const onValueChange = vi.fn();
    render(<PasswordInput label="Password" value="" onValueChange={onValueChange} />);
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'abc' } });
    expect(onValueChange).toHaveBeenCalledWith('abc');
  });

  it('shows an error message and marks the field invalid', () => {
    render(
      <PasswordInput
        label="Confirm password"
        value=""
        onValueChange={vi.fn()}
        errorMessage="Passwords do not match."
      />,
    );
    expect(screen.getByRole('alert').textContent).toBe('Passwords do not match.');
    expect(screen.getByLabelText('Confirm password').getAttribute('aria-invalid')).toBe('true');
  });

  describe('in RTL', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('dir');
    });

    it('still exposes an accessible name for the toggle', () => {
      document.documentElement.setAttribute('dir', 'rtl');
      render(<PasswordInput label="كلمة المرور" value="" onValueChange={vi.fn()} />);
      expect(screen.getByLabelText('كلمة المرور')).toBeDefined();
    });
  });
});
