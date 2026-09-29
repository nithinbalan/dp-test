import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { RISKS } from '@shared/mock/grc';
import { RisksList } from './RisksList';
import { resolveRisksMessages } from './RisksMessages';

export default async function RisksPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'risks');

  const openCount = RISKS.filter((risk) => risk.status === 'open').length;
  const criticalCount = RISKS.filter(
    (risk) => risk.level === 'critical' || risk.level === 'high',
  ).length;
  const closedCount = RISKS.filter((risk) => risk.status === 'closed').length;

  return (
    <RisksList
      risks={RISKS}
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      openCount={openCount}
      criticalCount={criticalCount}
      closedCount={closedCount}
      t={resolveRisksMessages(t)}
    />
  );
}
