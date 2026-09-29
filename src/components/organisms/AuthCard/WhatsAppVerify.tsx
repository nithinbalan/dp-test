/** Internal to AuthCard — see the note in StepHeader.tsx. */
'use client';

import { useState } from 'react';
import { Button } from '@atoms/Button';
import { OtpInput } from '@molecules/OtpInput';
import type { AuthCardMessages } from './AuthCard.types';
import { StepHeader } from './StepHeader';

export function WhatsAppVerify({
  t,
  isLoading,
  errorMessage,
  onBack,
  onSubmit,
  onChangeNumber,
  onResend,
}: {
  t: AuthCardMessages;
  isLoading: boolean;
  errorMessage: string | undefined;
  onBack: () => void;
  onSubmit: (code: string) => void;
  onChangeNumber: () => void;
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
      <StepHeader title={t.waVerifyTitle} backLabel={t.backToSignIn} onBack={onBack} />

      <OtpInput
        value={code}
        onValueChange={setCode}
        errorMessage={errorMessage}
        isDisabled={isLoading}
        messages={{ label: t.otpLabel, digitLabel: t.otpDigitLabel }}
      />

      <Button
        type="submit"
        variant="soft"
        tone="success"
        isLoading={isLoading}
        isDisabled={code.length < 6}
        fullWidth
      >
        {t.waVerifySubmit}
      </Button>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onChangeNumber}
          isDisabled={isLoading}
        >
          {t.waChangeNumber}
        </Button>
        <Button type="button" variant="link" size="sm" onClick={onResend} isDisabled={isLoading}>
          {t.waVerifyResend}
        </Button>
      </div>
    </form>
  );
}
