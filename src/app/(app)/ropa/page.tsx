import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { DATASETS } from '@shared/mock/data-map';
import { RopaList } from './RopaList';
import { resolveRopaMessages } from './RopaMessages';

export default async function RopaPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'ropa');
  const messages = resolveRopaMessages(t);

  return (
    <RopaList
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      unlinkedDatasetCount={DATASETS.filter((d) => !d.isLinkedToRopa).length}
      datasetCount={DATASETS.length}
      sourceCount={new Set(DATASETS.map((d) => d.sourceId)).size}
      t={messages}
    />
  );
}
