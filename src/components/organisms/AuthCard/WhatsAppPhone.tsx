/** Internal to AuthCard — see the note in StepHeader.tsx. */
'use client';

import { useState } from 'react';
import { Button } from '@atoms/Button';
import { Input } from '@atoms/Input';
import { Label } from '@atoms/Label';
import type { AuthCardMessages } from './AuthCard.types';
import { StepHeader } from './StepHeader';

export function WhatsAppPhone({
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
  onSubmit: (phone: string) => void;
}) {
  const [phone, setPhone] = useState('');

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(phone);
      }}
    >
      <StepHeader title={t.waPhoneTitle} backLabel={t.backToSignIn} onBack={onBack} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wa-phone" size="sm" isRequired>
          {t.waPhoneLabel}
        </Label>
        <Input
          id="wa-phone"
          type="tel"
          placeholder={t.waPhonePlaceholder}
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
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
        variant="soft"
        tone="success"
        isLoading={isLoading}
        isDisabled={phone === ''}
        fullWidth
      >
        {t.waPhoneSubmit}
      </Button>
    </form>
  );
}
