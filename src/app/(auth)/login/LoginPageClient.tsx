'use client';

/**
 * Owns the auth handlers connecting AuthCard to real backend API endpoints.
 *
 * Implements:
 * - Email/password credential login with workspace slug and remember-me
 * - Multi-step forgot password recovery (channel dispatch, OTP verification, password reset)
 * - Navigation to dashboard or returnTo target upon successful login
 *
 * See docs/WORKSPACE_ISOLATION.md and docs/TANSTACK_QUERY.md.
 */
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LocaleControls } from '@app/LocaleControls';
import { AuthCard, type AuthActionResult, type AuthCardMessages } from '@organisms/AuthCard';
import { AuthShell } from '@templates/AuthShell';
import {
  useRequestResetCode,
  useResetPassword,
  useSignIn,
  useVerifyResetCode,
} from '@shared/hooks/use-auth';
import { ApiError } from '@shared/lib/api-client';
import type { Locale } from '@shared/types/locale';
import { TrustPanel, type TrustPanelMessages } from './TrustPanel';

function useSignInHandler(workspaceValue: string, fallbackMessage: string) {
  const router = useRouter();
  const signInMutation = useSignIn();

  const handleSignIn = async (
    email: string,
    password: string,
    rememberMe: boolean,
  ): Promise<AuthActionResult> => {
    try {
      await signInMutation.mutateAsync({
        identifier: email,
        password,
        workspaceSlug: workspaceValue ? workspaceValue.trim() : undefined,
        rememberMe,
      });

      const returnTo =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('returnTo')
          : null;

      const targetUrl = (returnTo ?? '/dashboard') as Route;
      router.push(targetUrl);
      router.refresh();
      return {};
    } catch (e) {
      const message = e instanceof ApiError ? e.message : fallbackMessage;
      return { errorMessage: message };
    }
  };

  return { handleSignIn };
}

function useRecoveryHandlers(fallbackMessage: string) {
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryResetToken, setRecoveryResetToken] = useState('');

  const requestResetMutation = useRequestResetCode();
  const verifyResetMutation = useVerifyResetCode();
  const resetPasswordMutation = useResetPassword();

  const handleSendCode = async (
    identifier: string,
    channel: 'email' | 'whatsapp',
  ): Promise<AuthActionResult> => {
    try {
      setRecoveryIdentifier(identifier);
      await requestResetMutation.mutateAsync({ identifier, channel });
      return {};
    } catch (e) {
      const message = e instanceof ApiError ? e.message : fallbackMessage;
      return { errorMessage: message };
    }
  };

  const handleVerifyCode = async (code: string): Promise<AuthActionResult> => {
    try {
      const result = await verifyResetMutation.mutateAsync({
        identifier: recoveryIdentifier,
        code,
      });
      setRecoveryResetToken(result.resetToken);
      return {};
    } catch (e) {
      const message = e instanceof ApiError ? e.message : fallbackMessage;
      return { errorMessage: message };
    }
  };

  const handleResetPassword = async (newPassword: string): Promise<AuthActionResult> => {
    try {
      await resetPasswordMutation.mutateAsync({
        resetToken: recoveryResetToken,
        newPassword,
      });
      return {};
    } catch (e) {
      const message = e instanceof ApiError ? e.message : fallbackMessage;
      return { errorMessage: message };
    }
  };

  return { handleSendCode, handleVerifyCode, handleResetPassword };
}

export function LoginPageClient({
  locale,
  themeLabel,
  localeLabel,
  authMessages,
  trustPanelMessages,
  workspaceDomain,
}: {
  locale: Locale;
  themeLabel: string;
  localeLabel: string;
  authMessages: AuthCardMessages;
  trustPanelMessages: TrustPanelMessages;
  workspaceDomain: string;
}) {
  const [workspaceValue, setWorkspaceValue] = useState('');
  const { handleSignIn } = useSignInHandler(workspaceValue, authMessages.signInFailed);
  const { handleSendCode, handleVerifyCode, handleResetPassword } = useRecoveryHandlers(
    authMessages.genericError,
  );

  return (
    <AuthShell
      leftSlot={<TrustPanel t={trustPanelMessages} />}
      rightSlot={
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex justify-end gap-2">
            <LocaleControls current={locale} themeLabel={themeLabel} localeLabel={localeLabel} />
          </div>
          <AuthCard
            workspaceDomain={workspaceDomain}
            workspaceValue={workspaceValue}
            onWorkspaceValueChange={setWorkspaceValue}
            messages={authMessages}
            onSignIn={handleSignIn}
            onSendCode={handleSendCode}
            onVerifyCode={handleVerifyCode}
            onResetPassword={handleResetPassword}
          />
        </div>
      }
    />
  );
}
