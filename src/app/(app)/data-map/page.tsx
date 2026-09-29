import { DATASETS, getSourceNameFor } from '@shared/mock/data-map';
import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { DataMapList } from './DataMapList';
import type { DataMapMessages } from './DataMapMessages';

export default async function DataMapPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'data-map');

  const datasets = DATASETS.map((dataset) => ({
    ...dataset,
    sourceName: getSourceNameFor(dataset),
  }));

  const messages: DataMapMessages = {
    emptyTitle: t('emptyTitle'),
    emptyDescription: t('emptyDescription'),
    cta: t('cta'),
    secondaryCta: t('secondaryCta'),
    zeroTag: t('zeroTag'),

    searchPlaceholder: t('searchPlaceholder'),
    filterAll: t('filterAll'),
    filterUnclassified: t('filterUnclassified'),
    filterSensitive: t('filterSensitive'),
    addDatasetCta: t('addDatasetCta'),
    metaShowing: t('metaShowing'),
    clearFilters: t('clearFilters'),

    tableCaption: t('tableCaption'),
    tableDataset: t('tableDataset'),
    tableSource: t('tableSource'),
    tableIdentifiers: t('tableIdentifiers'),
    tableRecords: t('tableRecords'),
    tableRopa: t('tableRopa'),
    ropaLinked: t('ropaLinked'),
    ropaNotLinked: t('ropaNotLinked'),
    assignOwnerCta: t('assignOwnerCta'),
    discoveredByScan: t('discoveredByScan'),
    firstScanJustNow: t('firstScanJustNow'),
    activityOwner: t('activityOwner'),

    noResultsTitle: t('noResultsTitle'),
    noResultsDescription: t('noResultsDescription'),
    footerPrivacyNote: t('footerPrivacyNote'),
    footerTag: t('footerTag'),

    dialogStep: t('dialogStep'),
    dialogTitle: t('dialogTitle'),
    dialogDescription: t('dialogDescription'),
    dialogNameLabel: t('dialogNameLabel'),
    dialogNameSub: t('dialogNameSub'),
    dialogNamePlaceholder: t('dialogNamePlaceholder'),
    dialogNameError: t('dialogNameError'),
    dialogLocationLabel: t('dialogLocationLabel'),
    dialogLocationSub: t('dialogLocationSub'),
    dialogLocationPlaceholder: t('dialogLocationPlaceholder'),
    dialogLocationError: t('dialogLocationError'),
    dialogIdentifiersLabel: t('dialogIdentifiersLabel'),
    dialogIdentifiersSub: t('dialogIdentifiersSub'),
    dialogIdentifiersError: t('dialogIdentifiersError'),
    dialogRecordCountLabel: t('dialogRecordCountLabel'),
    dialogRecordCountSub: t('dialogRecordCountSub'),
    dialogRecordCountPlaceholder: t('dialogRecordCountPlaceholder'),
    dialogManualNote: t('dialogManualNote'),
    dialogCancel: t('dialogCancel'),
    dialogSubmit: t('dialogSubmit'),
    toastAdded: t('toastAdded'),
  };

  return (
    <DataMapList
      datasets={datasets}
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      t={messages}
    />
  );
}
