/** Internal to AuthCard — see the note in StepHeader.tsx. */
import { ChevronRight, Mail, MessageCircle } from 'lucide-react';
import { Card } from '@atoms/Card';
import { Text } from '@atoms/Text';
import type { AuthCardMessages } from './AuthCard.types';
import { StepHeader } from './StepHeader';

/**
 * A whole Card wrapped in a native button, per Card's own contract: `isInteractive`
 * only draws the affordance, a real control still has to make it clickable.
 */
function ChannelOption({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-start">
      <Card isInteractive variant="outline" size="md" className="flex items-center gap-3">
        <span aria-hidden className="text-fg-subtle shrink-0">
          {icon}
        </span>
        <span className="flex flex-1 flex-col gap-0.5">
          <Text size="sm" weight="medium">
            {title}
          </Text>
          <Text size="xs" tone="muted">
            {subtitle}
          </Text>
        </span>
        <ChevronRight aria-hidden className="text-fg-subtle size-4 shrink-0" />
      </Card>
    </button>
  );
}

export function ForgotPasswordChoose({
  t,
  onBack,
  onSelectEmail,
  onSelectWhatsApp,
}: {
  t: AuthCardMessages;
  onBack: () => void;
  onSelectEmail: () => void;
  onSelectWhatsApp: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <StepHeader
        title={t.fpChooseTitle}
        description={t.fpChooseSubtitle}
        backLabel={t.backToSignIn}
        onBack={onBack}
      />

      <div className="flex flex-col gap-2">
        <ChannelOption
          icon={<Mail className="size-4" />}
          title={t.fpChooseEmailTitle}
          subtitle={t.fpChooseEmailSubtitle}
          onClick={onSelectEmail}
        />
        <ChannelOption
          icon={<MessageCircle className="size-4" />}
          title={t.fpChooseWhatsAppTitle}
          subtitle={t.fpChooseWhatsAppSubtitle}
          onClick={onSelectWhatsApp}
        />
      </div>

      <Text size="xs" tone="muted" className="text-center">
        {t.fpChooseFooter}
      </Text>
    </div>
  );
}
