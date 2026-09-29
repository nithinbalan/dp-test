/** Internal to AuthCard — see the note in StepHeader.tsx. */
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import type { AuthCardMessages } from './AuthCard.types';

export function ForgotPasswordDone({
  t,
  onBackToSignIn,
}: {
  t: AuthCardMessages;
  onBackToSignIn: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <CheckCircle2 className="text-success-fg size-10" />
      <Heading level={2} size="lg">
        {t.fpDoneTitle}
      </Heading>
      <Text size="sm" tone="muted">
        {t.fpDoneBody}
      </Text>
      <Button type="button" tone="brand" fullWidth onClick={onBackToSignIn}>
        {t.fpDoneBackToSignIn}
      </Button>
    </div>
  );
}
