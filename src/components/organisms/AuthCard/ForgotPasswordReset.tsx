/** Internal to AuthCard — see the note in StepHeader.tsx. */
'use client';

import { useState } from 'react';
import { Button } from '@atoms/Button';
import { PasswordInput } from '@molecules/PasswordInput';
import type { AuthCardMessages } from './AuthCard.types';
import { StepHeader } from './StepHeader';

export function ForgotPasswordReset({
  t,
  isLoading,
  errorMessage,
  onBack,
  onSubmit,
}: {
  t: AuthCardMessages;
  isLoading: boolean;
  errorMessage: string | undefined;
  onBack: () => void;
  onSubmit: (newPassword: string) => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasBlurredConfirm, setHasBlurredConfirm] = useState(false);

  const mismatch =
    hasBlurredConfirm && confirmPassword !== '' && newPassword !== confirmPassword
      ? t.fpResetMismatch
      : undefined;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (newPassword === confirmPassword) onSubmit(newPassword);
      }}
    >
      <StepHeader
        title={t.fpResetTitle}
        description={t.fpResetSubtitle}
        backLabel={t.backToSignIn}
        onBack={onBack}
      />

      <PasswordInput
        label={t.fpResetNewPasswordLabel}
        value={newPassword}
        onValueChange={setNewPassword}
        autoComplete="new-password"
        isRequired
        isDisabled={isLoading}
        fullWidth
      />

      <div
        onBlur={() => {
          setHasBlurredConfirm(true);
        }}
      >
        <PasswordInput
          label={t.fpResetConfirmPasswordLabel}
          value={confirmPassword}
          onValueChange={setConfirmPassword}
          autoComplete="new-password"
          errorMessage={mismatch ?? errorMessage}
          isRequired
          isDisabled={isLoading}
          fullWidth
        />
      </div>

      <Button
        type="submit"
        tone="brand"
        isLoading={isLoading}
        isDisabled={newPassword === '' || confirmPassword === ''}
        fullWidth
      >
        {t.fpResetSubmit}
      </Button>
    </form>
  );
}
