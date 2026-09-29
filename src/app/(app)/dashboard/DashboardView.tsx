/** Presentational empty Dashboard state. Copy and navigation are supplied by page.tsx. */
import NextLink from 'next/link';
import { ClipboardList, Gauge } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import type { DashboardMessages } from './DashboardMessages';

export function DashboardView({
  t,
  pageLabel,
  pageRefTag,
  pageDescription,
}: {
  t: DashboardMessages;
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={pageLabel} refTag={t.overviewLabel} description={pageDescription} />

      <EmptyState
        label={t.emptyTitle}
        description={t.emptyDescription}
        startSlot={<Gauge className="size-8" strokeWidth={1.8} />}
        actionSlot={
          <Button asChild tone="brand" size="lg">
            <NextLink href="/readiness/assessment">
              <ClipboardList className="me-1.5 inline size-4" />
              {t.cta}
            </NextLink>
          </Button>
        }
        tone="brand"
        size="md"
        className="min-h-96 rounded-xl"
      >
        <Text as="span" size="2xs" tone="muted" isMono className="mt-3">
          {pageRefTag} · {t.moduleReference}
        </Text>
      </EmptyState>
    </div>
  );
}
