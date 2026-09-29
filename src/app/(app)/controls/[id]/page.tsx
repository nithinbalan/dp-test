import { notFound } from 'next/navigation';
import NextLink from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import { formatDate, getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { getControl } from '@shared/mock/controls';
import { automationLabel, domainLabel, statusLabel, typeLabel } from '../ControlLabels';
import { resolveControlsMessages } from '../ControlsMessages';

const STATUS_TONES = { pass: 'success', fail: 'danger', pending: 'warning' } as const;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border-default flex items-center justify-between border-b py-2 last:border-b-0">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text size="sm" weight="medium">
        {value}
      </Text>
    </div>
  );
}

export default async function ControlDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const control = getControl(id);
  if (!control) notFound();

  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'controls');
  const messages = resolveControlsMessages(t);

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <NextLink href="/controls" className="flex items-center gap-1.5">
          <ArrowLeft className="size-4" />
          {t('backToControls')}
        </NextLink>
      </Button>

      <div className="flex items-center gap-3">
        <Heading level={1} size="xl">
          {control.title}
        </Heading>
        <Badge tone={STATUS_TONES[control.status]}>{statusLabel(messages, control.status)}</Badge>
      </div>

      <Text size="sm" tone="muted" className="max-w-2xl">
        {control.statement}
      </Text>

      <Card variant="outline" size="md" className="max-w-lg">
        <DetailRow label={messages.tableDomain} value={domainLabel(messages, control.domain)} />
        <DetailRow label={messages.tableType} value={typeLabel(messages, control.type)} />
        <DetailRow label={messages.actRefLabel} value={control.actRef} />
        <DetailRow
          label={messages.tableAutomation}
          value={automationLabel(messages, control.automation)}
        />
        <DetailRow label={messages.evidenceLabel} value={String(control.evidenceCount)} />
        <DetailRow label={messages.lastCheckedLabel} value={formatDate(control.lastCheckedAt)} />
      </Card>
    </div>
  );
}
