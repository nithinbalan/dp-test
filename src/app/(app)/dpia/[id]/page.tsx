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
import { getDpia } from '@shared/mock/dpia';
import { getPerson } from '@shared/mock/people';
import { dpiaRiskLabel, dpiaStatusLabel, resolveDpiaMessages } from '../DpiaMessages';

const STATUS_TONES = {
  'not-started': 'neutral',
  'in-progress': 'warning',
  completed: 'success',
} as const;

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

export default async function DpiaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dpia = getDpia(id);
  if (!dpia) notFound();

  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'dpia');
  const messages = resolveDpiaMessages(t);
  const owner = getPerson(dpia.ownerId);

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <NextLink href="/dpia" className="flex items-center gap-1.5">
          <ArrowLeft className="size-4" />
          {messages.backToDpia}
        </NextLink>
      </Button>

      <div className="flex items-center gap-3">
        <Heading level={1} size="xl">
          {dpia.activityName}
        </Heading>
        <Badge tone={STATUS_TONES[dpia.status]}>{dpiaStatusLabel(messages, dpia.status)}</Badge>
      </div>

      <Text size="sm" tone="muted" className="max-w-2xl">
        {dpia.requiredReason}
      </Text>

      <Card variant="outline" size="md" className="max-w-lg">
        <DetailRow label={messages.requiredReasonLabel} value={dpia.requiredReason} />
        <DetailRow
          label={messages.tableRiskLevel}
          value={dpiaRiskLabel(messages, dpia.riskLevel)}
        />
        <DetailRow label={messages.identifiedRisksLabel} value={String(dpia.identifiedRisks)} />
        <DetailRow label={messages.tableOwner} value={owner?.name ?? '—'} />
        <DetailRow label={messages.tableUpdated} value={formatDate(dpia.updatedAt)} />
      </Card>
    </div>
  );
}
