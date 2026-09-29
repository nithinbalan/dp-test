/** Internal to AuthCard — see the note in StepHeader.tsx. */
'use client';

import { useState } from 'react';
import { Info, MessageCircle } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Checkbox } from '@atoms/Checkbox';
import { Divider } from '@atoms/Divider';
import { Link } from '@atoms/Link';
import { Text } from '@atoms/Text';
import { Alert } from '@molecules/Alert';
import { LoginForm } from '@molecules/LoginForm';
import { WorkspaceField } from '@molecules/WorkspaceField';
import type { AuthCardMessages } from './AuthCard.types';

function WorkspaceSection({
  t,
  workspaceDomain,
  workspaceValue,
  onWorkspaceValueChange,
  onFindWorkspaceClick,
}: {
  t: AuthCardMessages;
  workspaceDomain: string;
  workspaceValue: string;
  onWorkspaceValueChange: (value: string) => void;
  onFindWorkspaceClick: (() => void) | undefined;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <WorkspaceField
        value={workspaceValue}
        onValueChange={onWorkspaceValueChange}
        domain={workspaceDomain}
        messages={{
          label: t.workspaceLabel,
          placeholder: t.workspacePlaceholder,
          changeLabel: t.workspaceChangeLabel,
        }}
      />
      {onFindWorkspaceClick && (
        <Button
          type="button"
          variant="link"
          size="xs"
          tone="neutral"
          onClick={onFindWorkspaceClick}
          className="self-start"
        >
          {t.findWorkspace}
        </Button>
      )}
    </div>
  );
}

function RequestAccessLine({
  t,
  onRequestAccessClick,
}: {
  t: AuthCardMessages;
  onRequestAccessClick: (() => void) | undefined;
}) {
  return (
    <Text size="sm" tone="muted" className="text-center">
      {t.noAccount}{' '}
      {onRequestAccessClick ? (
        <Button type="button" variant="link" size="sm" onClick={onRequestAccessClick}>
          {t.requestAccess}
        </Button>
      ) : (
        <Link href="#" size="sm">
          {t.requestAccess}
        </Link>
      )}
    </Text>
  );
}

function AlternateSignIn({
  t,
  isLoading,
  rememberMe,
  onRememberMeChange,
  onWhatsAppClick,
}: {
  t: AuthCardMessages;
  isLoading: boolean;
  rememberMe: boolean;
  onRememberMeChange: (value: boolean) => void;
  onWhatsAppClick: () => void;
}) {
  return (
    <>
      <Checkbox
        checked={rememberMe}
        onValueChange={onRememberMeChange}
        isDisabled={isLoading}
        size="sm"
      >
        {t.keepSignedIn}
      </Checkbox>

      <Divider>
        <Text size="xs" tone="muted">
          {t.orDivider}
        </Text>
      </Divider>

      <Button
        type="button"
        variant="soft"
        tone="success"
        fullWidth
        isDisabled={isLoading}
        onClick={onWhatsAppClick}
        startSlot={<MessageCircle className="size-4" />}
      >
        {t.whatsappSignIn}
      </Button>
    </>
  );
}

export function SignInView({
  t,
  workspaceDomain,
  workspaceValue,
  onWorkspaceValueChange,
  isLoading,
  errorMessage,
  onSignIn,
  onForgotPasswordClick,
  onWhatsAppClick,
  onRequestAccessClick,
  onFindWorkspaceClick,
}: {
  t: AuthCardMessages;
  workspaceDomain: string;
  workspaceValue: string;
  onWorkspaceValueChange: (value: string) => void;
  isLoading: boolean;
  errorMessage: string | undefined;
  onSignIn: (email: string, password: string, rememberMe: boolean) => void;
  onForgotPasswordClick: () => void;
  onWhatsAppClick: () => void;
  onRequestAccessClick: (() => void) | undefined;
  onFindWorkspaceClick: (() => void) | undefined;
}) {
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div className="flex flex-col gap-5">
      <Alert
        tone="info"
        variant="soft"
        label={t.devModeHintLabel}
        description={t.devModeHintDescription}
        startSlot={<Info className="size-4" />}
      />

      <WorkspaceSection
        t={t}
        workspaceDomain={workspaceDomain}
        workspaceValue={workspaceValue}
        onWorkspaceValueChange={onWorkspaceValueChange}
        onFindWorkspaceClick={onFindWorkspaceClick}
      />

      <LoginForm
        isLoading={isLoading}
        errorMessage={errorMessage}
        onForgotPasswordClick={onForgotPasswordClick}
        onSubmit={(email, password) => {
          onSignIn(email, password, rememberMe);
        }}
        messages={{
          emailLabel: t.emailLabel,
          emailPlaceholder: t.emailPlaceholder,
          passwordLabel: t.passwordLabel,
          forgotPassword: t.forgotPassword,
          submit: t.submit,
          showPassword: t.showPassword,
          hidePassword: t.hidePassword,
        }}
      />

      <AlternateSignIn
        t={t}
        isLoading={isLoading}
        rememberMe={rememberMe}
        onRememberMeChange={setRememberMe}
        onWhatsAppClick={onWhatsAppClick}
      />

      <RequestAccessLine t={t} onRequestAccessClick={onRequestAccessClick} />
    </div>
  );
}
