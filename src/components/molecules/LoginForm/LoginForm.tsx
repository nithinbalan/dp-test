'use client';

/**
 * @tier molecules
 *
 * Composes Input and Button atoms into a login form. Owns local controlled state
 * for the two fields; delegates submission to the `onSubmit` prop so the caller
 * decides what happens next (redirect, server action, etc.).
 *
 * All copy comes from `messages`. The English values below are DEFAULTS, not
 * embedded text — an app rendering in Arabic passes its own. That distinction is
 * what `local/no-literal-ui-text` enforces.
 *
 * No data fetching here — that is the page's job (docs/ARCHITECTURE.md).
 */
import { useState, type SyntheticEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@atoms/Button';
import { IconButton } from '@atoms/IconButton';
import { Input } from '@atoms/Input';
import { cn } from '@shared/lib';
import type { LoginFormMessages, LoginFormProps } from './LoginForm.types';

const DEFAULT_MESSAGES: LoginFormMessages = {
  emailLabel: 'Email address',
  emailPlaceholder: 'you@example.com',
  passwordLabel: 'Password',
  forgotPassword: 'Forgot password?',
  submit: 'Sign in',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
};

/**
 * A link when the caller navigates, a button when it switches to an in-page
 * view — see `onForgotPasswordClick` on {@link LoginFormProps}.
 */
function ForgotPasswordLink({
  label,
  href,
  onClick,
}: {
  label: string;
  href: string;
  onClick: (() => void) | undefined;
}) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-brand-fg text-sm hover:underline">
        {label}
      </button>
    );
  }
  return (
    <a href={href} className="text-brand-fg text-sm hover:underline">
      {label}
    </a>
  );
}

function PasswordVisibilityToggle({
  isVisible,
  isDisabled,
  showLabel,
  hideLabel,
  onToggle,
}: {
  isVisible: boolean;
  isDisabled: boolean;
  showLabel: string;
  hideLabel: string;
  onToggle: () => void;
}) {
  return (
    <IconButton
      label={isVisible ? hideLabel : showLabel}
      size="xs"
      variant="ghost"
      isDisabled={isDisabled}
      onClick={onToggle}
    >
      {isVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
    </IconButton>
  );
}

function EmailField({
  value,
  onValueChange,
  label,
  placeholder,
  isDisabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder: string;
  isDisabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="login-email" className="text-fg-default text-sm font-medium">
        {label}
      </label>
      <Input
        id="login-email"
        type="email"
        autoComplete="email"
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        isRequired
        isDisabled={isDisabled}
        fullWidth
      />
    </div>
  );
}

function PasswordField({
  value,
  onValueChange,
  label,
  isDisabled,
  isVisible,
  onToggleVisible,
  showLabel,
  hideLabel,
  forgotPasswordHref,
  forgotPasswordLabel,
  onForgotPasswordClick,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  isDisabled: boolean;
  isVisible: boolean;
  onToggleVisible: () => void;
  showLabel: string;
  hideLabel: string;
  forgotPasswordHref: string;
  forgotPasswordLabel: string;
  onForgotPasswordClick: (() => void) | undefined;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="login-password" className="text-fg-default text-sm font-medium">
          {label}
        </label>
        <ForgotPasswordLink
          label={forgotPasswordLabel}
          href={forgotPasswordHref}
          onClick={onForgotPasswordClick}
        />
      </div>
      <Input
        id="login-password"
        type={isVisible ? 'text' : 'password'}
        autoComplete="current-password"
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        isRequired
        isDisabled={isDisabled}
        fullWidth
        endSlot={
          <PasswordVisibilityToggle
            isVisible={isVisible}
            isDisabled={isDisabled}
            showLabel={showLabel}
            hideLabel={hideLabel}
            onToggle={onToggleVisible}
          />
        }
      />
    </div>
  );
}

export function LoginForm({
  onSubmit,
  isLoading = false,
  errorMessage,
  messages,
  forgotPasswordHref = '#',
  onForgotPasswordClick,
  className,
  testId,
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const t = { ...DEFAULT_MESSAGES, ...messages };

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit?.(email, password);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn('flex w-full flex-col gap-5', className)}
      data-testid={testId}
    >
      <EmailField
        value={email}
        onValueChange={setEmail}
        label={t.emailLabel}
        placeholder={t.emailPlaceholder}
        isDisabled={isLoading}
      />

      <PasswordField
        value={password}
        onValueChange={setPassword}
        label={t.passwordLabel}
        isDisabled={isLoading}
        isVisible={isPasswordVisible}
        onToggleVisible={() => {
          setIsPasswordVisible((current) => !current);
        }}
        showLabel={t.showPassword}
        hideLabel={t.hidePassword}
        forgotPasswordHref={forgotPasswordHref}
        forgotPasswordLabel={t.forgotPassword}
        onForgotPasswordClick={onForgotPasswordClick}
      />

      {errorMessage !== undefined && errorMessage !== '' && (
        <p role="alert" className="text-danger-fg text-sm">
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        tone="brand"
        isLoading={isLoading}
        isDisabled={email === '' || password === ''}
        fullWidth
      >
        {t.submit}
      </Button>
    </form>
  );
}
