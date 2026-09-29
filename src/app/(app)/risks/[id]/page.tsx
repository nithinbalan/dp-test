import { notFound } from 'next/navigation';
import NextLink from 'next/link';
import type { Route } from 'next';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@atoms/Badge';
import { Button } from '@atoms/Button';
import { Card } from '@atoms/Card';
import { Heading } from '@atoms/Heading';
import { Text } from '@atoms/Text';
import { formatDate, getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { getRisk } from '@shared/mock/grc';
import { getPerson } from '@shared/mock/people';
import {
  riskLevelLabel,
  riskSourceLabel,
  riskStatusLabel,
  resolveRisksMessages,
} from '../RisksMessages';

const STATUS_TONES = { open: 'danger', mitigating: 'warning', closed: 'success' } as const;

// `typedRoutes` only recognises a template literal it can see directly in JSX;
// a lookup table like this one defeats that static analysis even though every
// branch builds a real route, so the cast is required at construction — see
// the matching note in `ActionsTable.tsx`, which has the same shape.
const SOURCE_HREF: Record<string, (ref: string) => Route> = {
  control: (ref) => `/controls/${ref}` as Route,
  'gap-assessment': () => '/readiness',
  dpia: (ref) => `/dpia/${ref}` as Route,
};

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

export default async function RiskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const risk = getRisk(id);
  if (!risk) notFound();

  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'risks');
  const messages = resolveRisksMessages(t);
  const owner = getPerson(risk.ownerId);
  const sourceHref = SOURCE_HREF[risk.sourceType]?.(risk.sourceRef) ?? '/risks';

  return (
    <div className="flex flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="w-fit">
        <NextLink href="/risks" className="flex items-center gap-1.5">
          <ArrowLeft className="size-4" />
          {messages.backToRisks}
        </NextLink>
      </Button>

      <div className="flex items-center gap-3">
        <Heading level={1} size="xl">
          {risk.title}
        </Heading>
        <Badge tone={STATUS_TONES[risk.status]}>{riskStatusLabel(messages, risk.status)}</Badge>
      </div>

      <Card variant="outline" size="md" className="max-w-lg">
        <DetailRow label={messages.tableDomain} value={risk.domain} />
        <DetailRow label={messages.tableLevel} value={riskLevelLabel(messages, risk.level)} />
        <DetailRow label={messages.likelihoodLabel} value={`${String(risk.likelihood)} / 5`} />
        <DetailRow label={messages.impactLabel} value={`${String(risk.impact)} / 5`} />
        <DetailRow label={messages.tableOwner} value={owner?.name ?? '—'} />
        <DetailRow label={messages.identifiedAtLabel} value={formatDate(risk.identifiedAt)} />
      </Card>

      <Button asChild variant="outline" className="w-fit">
        <NextLink href={sourceHref}>
          {messages.sourceRefLabel}: {riskSourceLabel(messages, risk.sourceType)} · {risk.sourceRef}
        </NextLink>
      </Button>
    </div>
  );
}
