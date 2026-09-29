import { AlertTriangle } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';

export default async function IssuesPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'modules');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={t('issuesLabel')} refTag={t('issuesRefTag')} />
      <EmptyState
        label={t('genericEmptyLabel')}
        description={t('issuesDescription')}
        startSlot={<AlertTriangle className="size-6" />}
        actionSlot={<Button tone="brand">{t('issuesCta')}</Button>}
      >
        <Text size="xs" tone="muted" isMono>
          {t('issuesCaption')}
        </Text>
      </EmptyState>
    </div>
  );
}
