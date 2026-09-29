import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthCard } from './AuthCard';

function setup(props: Partial<React.ComponentProps<typeof AuthCard>> = {}) {
  const onWorkspaceValueChange = vi.fn();
  render(
    <AuthCard
      workspaceDomain=".jethurdpdp.com"
      workspaceValue=""
      onWorkspaceValueChange={onWorkspaceValueChange}
      {...props}
    />,
  );
  return { onWorkspaceValueChange };
}

describe('AuthCard', () => {
  it('renders the sign-in view by default', () => {
    setup();
    expect(screen.getByLabelText('Work email')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sign in with OTP on WhatsApp' })).toBeDefined();
  });

  it('calls onSignIn with the entered credentials', async () => {
    const onSignIn = vi.fn().mockResolvedValue({});
    setup({ onSignIn });

    fireEvent.change(screen.getByLabelText('Work email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(onSignIn).toHaveBeenCalledWith('user@example.com', 'hunter2', true);
    });
  });

  it('shows the returned error message on failed sign-in', async () => {
    const onSignIn = vi.fn().mockResolvedValue({ errorMessage: 'Invalid credentials.' });
    setup({ onSignIn });

    fireEvent.change(screen.getByLabelText('Work email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid credentials.')).toBeDefined();
  });

  it('navigates into the forgot-password flow and back', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(screen.getByText('Email me the code')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Back to sign in' }));
    expect(screen.getByLabelText('Work email')).toBeDefined();
  });

  it('walks the forgot-password flow through to the reset step', async () => {
    const onSendCode = vi.fn().mockResolvedValue({});
    const onVerifyCode = vi.fn().mockResolvedValue({});
    setup({ onSendCode, onVerifyCode });

    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    fireEvent.click(screen.getByText('Email me the code'));

    fireEvent.change(screen.getByLabelText('Work email', { exact: false }), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send code' }));
    await waitFor(() => {
      expect(onSendCode).toHaveBeenCalledWith('user@example.com', 'email');
    });

    const cells = await screen.findAllByRole('textbox');
    cells.forEach((cell, index) => {
      fireEvent.change(cell, { target: { value: String(index) } });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() => {
      expect(onVerifyCode).toHaveBeenCalledWith('012345');
    });
    expect(await screen.findByLabelText('New password', { exact: false })).toBeDefined();
  });

  it('navigates into the WhatsApp OTP flow', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with OTP on WhatsApp' }));
    expect(screen.getByLabelText('WhatsApp number', { exact: false })).toBeDefined();
  });
});
