import { SquareCheckBig } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';

export default async function ConsentPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'modules');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={t('consentLabel')} refTag={t('consentRefTag')} />
      <EmptyState
        label={t('genericEmptyLabel')}
        description={t('consentDescription')}
        startSlot={<SquareCheckBig className="size-6" />}
        actionSlot={<Button tone="brand">{t('consentCta')}</Button>}
      >
        <Text size="xs" tone="muted" isMono>
          {t('consentCaption')}
        </Text>
      </EmptyState>
    </div>
  );
}
