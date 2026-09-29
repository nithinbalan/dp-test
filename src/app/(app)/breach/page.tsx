import { ShieldAlert } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';

export default async function BreachPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'modules');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={t('breachLabel')} refTag={t('breachRefTag')} />
      <EmptyState
        label={t('genericEmptyLabel')}
        description={t('breachDescription')}
        tone="warning"
        startSlot={<ShieldAlert className="size-6" />}
        actionSlot={
          <>
            <Button tone="brand">{t('breachCta')}</Button>
            <Button variant="outline">{t('breachSecondaryCta')}</Button>
          </>
        }
      >
        <Text size="xs" tone="muted" isMono>
          {t('breachCaption')}
        </Text>
      </EmptyState>
    </div>
  );
}
