import { Building2 } from 'lucide-react';
import { Button } from '@atoms/Button';
import { Text } from '@atoms/Text';
import { EmptyState } from '@molecules/EmptyState';
import { PageHeader } from '@molecules/PageHeader';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';

export default async function ThirdPartyPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'modules');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader label={t('thirdPartyLabel')} refTag={t('thirdPartyRefTag')} />
      <EmptyState
        label={t('genericEmptyLabel')}
        description={t('thirdPartyDescription')}
        startSlot={<Building2 className="size-6" />}
        actionSlot={<Button tone="brand">{t('thirdPartyCta')}</Button>}
      >
        <Text size="xs" tone="muted" isMono>
          {t('thirdPartyCaption')}
        </Text>
      </EmptyState>
    </div>
  );
}
