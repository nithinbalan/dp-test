import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email address')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
  });

  it('submit button is disabled until both fields are filled', () => {
    render(<LoginForm />);
    const button = screen.getByRole('button', { name: 'Sign in' });
    expect(button.hasAttribute('disabled')).toBe(true);

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' },
    });
    expect(button.hasAttribute('disabled')).toBe(true); // still missing password

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('calls onSubmit with email and password', () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} testId="login-form" />);

    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'hunter2' },
    });
    fireEvent.submit(screen.getByTestId('login-form'));
    expect(onSubmit).toHaveBeenCalledWith('user@example.com', 'hunter2');
  });

  it('displays an error message when errorMessage is provided', () => {
    render(<LoginForm errorMessage="Invalid credentials." />);
    expect(screen.getByRole('alert').textContent).toBe('Invalid credentials.');
  });

  it('toggles password visibility', () => {
    render(<LoginForm />);
    const input = screen.getByLabelText('Password');
    expect(input.getAttribute('type')).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input.getAttribute('type')).toBe('text');
  });

  it('renders "Forgot password?" as a link by default, and a button when onForgotPasswordClick is set', () => {
    const { rerender } = render(<LoginForm forgotPasswordHref="/reset" />);
    expect(screen.getByRole('link', { name: 'Forgot password?' }).getAttribute('href')).toBe(
      '/reset',
    );

    const onForgotPasswordClick = vi.fn();
    rerender(<LoginForm onForgotPasswordClick={onForgotPasswordClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(onForgotPasswordClick).toHaveBeenCalled();
  });
});

describe('LoginForm localisation', () => {
  it('renders Arabic copy when messages are supplied', () => {
    render(
      <LoginForm
        messages={{
          emailLabel: 'البريد الإلكتروني',
          passwordLabel: 'كلمة المرور',
          submit: 'تسجيل الدخول',
        }}
      />,
    );
    expect(screen.getByText('البريد الإلكتروني')).toBeDefined();
    expect(screen.getByText('كلمة المرور')).toBeDefined();
    expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeDefined();
  });
});
