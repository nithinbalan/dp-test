import { Inbox } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';

export default async function DsrPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'modules');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={t('dsrLabel')} refTag={t('dsrRefTag')} />
      <EmptyState
        label={t('genericEmptyLabel')}
        description={t('dsrDescription')}
        startSlot={<Inbox className="size-6" />}
        actionSlot={
          <>
            <Button tone="brand">{t('dsrCta')}</Button>
            <Button variant="outline">{t('dsrSecondaryCta')}</Button>
          </>
        }
      >
        <Text size="xs" tone="muted" isMono>
          {t('dsrCaption')}
        </Text>
      </EmptyState>
    </div>
  );
}
