/** Internal to AuthCard — see the note in StepHeader.tsx. */
'use client';

import { useState } from 'react';
import { Button } from '@atoms/Button';
import { Input } from '@atoms/Input';
import { Label } from '@atoms/Label';
import type { AuthCardMessages } from './AuthCard.types';
import { StepHeader } from './StepHeader';

export function ForgotPasswordEnter({
  t,
  channel,
  isLoading,
  errorMessage,
  onBack,
  onSubmit,
}: {
  t: AuthCardMessages;
  channel: 'email' | 'whatsapp';
  isLoading: boolean;
  errorMessage: string | undefined;
  onBack: () => void;
  onSubmit: (identifier: string) => void;
}) {
  const [identifier, setIdentifier] = useState('');
  const isEmail = channel === 'email';
  const label = isEmail ? t.fpEnterEmailLabel : t.fpEnterWhatsAppLabel;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(identifier);
      }}
    >
      <StepHeader title={t.fpEnterTitle} backLabel={t.backToSignIn} onBack={onBack} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fp-identifier" size="sm" isRequired>
          {label}
        </Label>
        <Input
          id="fp-identifier"
          type={isEmail ? 'email' : 'tel'}
          placeholder={isEmail ? t.fpEnterEmailPlaceholder : t.fpEnterWhatsAppPlaceholder}
          value={identifier}
          onChange={(event) => {
            setIdentifier(event.target.value);
          }}
          isRequired
          isInvalid={errorMessage !== undefined}
          isDisabled={isLoading}
          fullWidth
        />
        {errorMessage !== undefined && (
          <p role="alert" className="text-danger-fg text-xs">
            {errorMessage}
          </p>
        )}
      </div>

      <Button
        type="submit"
        tone="brand"
        isLoading={isLoading}
        isDisabled={identifier === ''}
        fullWidth
      >
        {t.fpEnterSubmit}
      </Button>
    </form>
  );
}
