import { Inbox } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';

export default async function CollectionPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'modules');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={t('collectionLabel')} refTag={t('collectionRefTag')} />
      <EmptyState
        label={t('genericEmptyLabel')}
        description={t('collectionDescription')}
        startSlot={<Inbox className="size-6" />}
        actionSlot={<Button tone="brand">{t('collectionCta')}</Button>}
      >
        <Text size="xs" tone="muted" isMono>
          {t('collectionCaption')}
        </Text>
      </EmptyState>
    </div>
  );
}
