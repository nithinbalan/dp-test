/** Page-local — copy for the source register, resolved server-side in page.tsx. */
import type { Translate } from '@shared/lib';

export type DataSourcesMessages = {
  pageLabel: string;
  pageRefTag: string;
  pageDescription: string;

  emptyTitle: string;
  emptyDescription: string;
  emptyCta: string;
  badgeReadOnly: string;
  badgeSampled: string;
  badgeRegion: string;

  kpiTotalSources: string;
  kpiConnected: string;
  kpiConnectedDescription: string;
  kpiWithPii: string;
  kpiDatasets: string;

  searchPlaceholder: string;
  statusFilterLabel: string;
  statusAll: string;
  statusConnected: string;
  statusOff: string;
  statusPii: string;
  typeFilterLabel: string;
  typeAll: string;
  typeApp: string;
  typeDb: string;
  typeCloud: string;
  typeFile: string;
  scanAllCta: string;
  addSourceCta: string;
  viewLabel: string;
  viewTree: string;
  viewTable: string;

  registerLabel: string;
  tableCaption: string;
  tableName: string;
  tableType: string;
  tableStatus: string;
  tablePii: string;
  tableLastScan: string;
  tableActions: string;

  typeLabelApp: string;
  typeLabelDb: string;
  typeLabelCloud: string;
  typeLabelFile: string;

  connStatusConnected: string;
  connStatusOff: string;
  piiNone: string;
  piiNotScanned: string;
  piiScanning: string;

  connectCta: string;
  connectingLabel: string;
  scanNowLabel: string;
  viewDetailsLabel: string;
  expandLabel: string;
  collapseLabel: string;
  scanningLabel: string;
  firstScanLabel: string;
  scanProgressLabel: string;
  showLess: string;

  noResultsTitle: string;
  noResultsDescription: string;
  clearFiltersCta: string;

  footerNextScan: string;
  footerReadOnly: string;
  footerFeeds: string;

  toastScanAllStarted: string;
  toastConnectStarted: string;

  /** Templates filled in on the client, where the count or name is known. */
  piiTypesFound: string;
  piiOneTypeFound: string;
  discoveredCount: string;
  loadMore: string;
  showingCount: string;
  toastScanOneStarted: string;
};

export function buildDataSourcesMessages(t: Translate<'data-sources'>): DataSourcesMessages {
  return {
    pageLabel: t('label'),
    pageRefTag: t('refTag'),
    pageDescription: t('description'),

    emptyTitle: t('emptyTitle'),
    emptyDescription: t('emptyDescription'),
    emptyCta: t('cta'),
    badgeReadOnly: t('badgeReadOnly'),
    badgeSampled: t('badgeSampled'),
    badgeRegion: t('badgeRegion'),

    kpiTotalSources: t('kpiTotalSources'),
    kpiConnected: t('kpiConnected'),
    kpiConnectedDescription: t('kpiConnectedDescription'),
    kpiWithPii: t('kpiWithPii'),
    kpiDatasets: t('kpiDatasets'),

    searchPlaceholder: t('searchPlaceholder'),
    statusFilterLabel: t('statusFilterLabel'),
    statusAll: t('statusAll'),
    statusConnected: t('statusConnected'),
    statusOff: t('statusOff'),
    statusPii: t('statusPii'),
    typeFilterLabel: t('typeFilterLabel'),
    typeAll: t('typeAll'),
    typeApp: t('typeApp'),
    typeDb: t('typeDb'),
    typeCloud: t('typeCloud'),
    typeFile: t('typeFile'),
    scanAllCta: t('scanAllCta'),
    addSourceCta: t('addSourceCta'),
    viewLabel: t('viewLabel'),
    viewTree: t('viewTree'),
    viewTable: t('viewTable'),

    registerLabel: t('registerLabel'),
    tableCaption: t('tableCaption'),
    tableName: t('tableName'),
    tableType: t('tableType'),
    tableStatus: t('tableStatus'),
    tablePii: t('tablePii'),
    tableLastScan: t('tableLastScan'),
    tableActions: t('tableActions'),

    typeLabelApp: t('typeLabelApp'),
    typeLabelDb: t('typeLabelDb'),
    typeLabelCloud: t('typeLabelCloud'),
    typeLabelFile: t('typeLabelFile'),

    connStatusConnected: t('connStatusConnected'),
    connStatusOff: t('connStatusOff'),
    piiNone: t('piiNone'),
    piiNotScanned: t('piiNotScanned'),
    piiScanning: t('piiScanning'),

    connectCta: t('connectCta'),
    connectingLabel: t('connectingLabel'),
    scanNowLabel: t('scanNowLabel'),
    viewDetailsLabel: t('viewDetailsLabel'),
    expandLabel: t('expandLabel'),
    collapseLabel: t('collapseLabel'),
    scanningLabel: t('scanningLabel'),
    firstScanLabel: t('firstScanLabel'),
    scanProgressLabel: t('scanProgressLabel'),
    showLess: t('showLess'),

    noResultsTitle: t('noResultsTitle'),
    noResultsDescription: t('noResultsDescription'),
    clearFiltersCta: t('clearFiltersCta'),

    footerNextScan: t('footerNextScan'),
    footerReadOnly: t('footerReadOnly'),
    footerFeeds: t('footerFeeds'),

    toastScanAllStarted: t('toastScanAllStarted'),
    toastConnectStarted: t('toastConnectStarted'),

    piiTypesFound: t('piiTypesFound'),
    piiOneTypeFound: t('piiOneTypeFound'),
    discoveredCount: t('discoveredCount'),
    loadMore: t('loadMore'),
    showingCount: t('showingCount'),
    toastScanOneStarted: t('toastScanOneStarted'),
  };
}
