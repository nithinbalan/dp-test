/** Internal to AuthCard — see the note in StepHeader.tsx. */
'use client';

import { useState } from 'react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { OtpInput } from '@molecules/OtpInput';
import type { AuthCardMessages } from './AuthCard.types';
import { StepHeader } from './StepHeader';

export function ForgotPasswordVerify({
  t,
  isLoading,
  errorMessage,
  onBack,
  onSubmit,
  onResend,
}: {
  t: AuthCardMessages;
  isLoading: boolean;
  errorMessage: string | undefined;
  onBack: () => void;
  onSubmit: (code: string) => void;
  onResend: () => void;
}) {
  const [code, setCode] = useState('');

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(code);
      }}
    >
      <StepHeader title={t.fpVerifyTitle} backLabel={t.backToSignIn} onBack={onBack} />

      <OtpInput
        value={code}
        onValueChange={setCode}
        errorMessage={errorMessage}
        isDisabled={isLoading}
        messages={{ label: t.otpLabel, digitLabel: t.otpDigitLabel }}
      />

      <Text size="xs" tone="muted">
        {t.fpVerifyHint}
      </Text>

      <Button
        type="submit"
        tone="brand"
        isLoading={isLoading}
        isDisabled={code.length < 6}
        fullWidth
      >
        {t.fpVerifySubmit}
      </Button>

      <Button type="button" variant="link" size="sm" onClick={onResend} isDisabled={isLoading}>
        {t.fpVerifyResend}
      </Button>
    </form>
  );
}
