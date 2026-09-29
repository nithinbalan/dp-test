import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { DashboardView } from './DashboardView';
import type { DashboardMessages } from './DashboardMessages';

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'dashboard');

  const messages: DashboardMessages = {
    overviewLabel: t('overviewLabel'),
    emptyTitle: t('emptyTitle'),
    emptyDescription: t('emptyDescription'),
    cta: t('cta'),
    moduleReference: t('moduleReference'),
  };

  return (
    <DashboardView
      t={messages}
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
    />
  );
}
