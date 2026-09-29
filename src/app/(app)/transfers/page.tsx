import { Globe2 } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';

export default async function TransfersPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'modules');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={t('transfersLabel')} refTag={t('transfersRefTag')} />
      <EmptyState
        label={t('genericEmptyLabel')}
        description={t('transfersDescription')}
        startSlot={<Globe2 className="size-6" />}
        actionSlot={<Button tone="brand">{t('transfersCta')}</Button>}
      >
        <Text size="xs" tone="muted" isMono>
          {t('transfersCaption')}
        </Text>
      </EmptyState>
    </div>
  );
}
