import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { ACTIVITIES } from '@shared/mock/ropa';
import { DPIAS } from '@shared/mock/dpia';
import { DpiaReport } from './DpiaReport';
import { resolveDpiaMessages } from './DpiaMessages';

export default async function DpiaPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'dpia');

  const completedCount = DPIAS.filter((dpia) => dpia.status === 'completed').length;
  const highRiskCount = DPIAS.filter((dpia) => dpia.riskLevel === 'high').length;
  const clearedCount = ACTIVITIES.length - DPIAS.length;

  return (
    <DpiaReport
      t={resolveDpiaMessages(t)}
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      dpias={DPIAS}
      screenedCount={ACTIVITIES.length}
      clearedCount={clearedCount}
      completedCount={completedCount}
      highRiskCount={highRiskCount}
    />
  );
}
