/** Resolves the detail view's copy server-side. See `SourceDetail.types`. */
import type { Translate } from '@shared/lib';
import type { SourceDetailMessages } from './SourceDetail.types';

/** The header, the banners, the tab strip and the overview statistics. */
function buildShellMessages(t: Translate<'data-sources'>) {
  return {
    backLabel: t('detailBackLabel'),
    notFoundTitle: t('noResultsTitle'),
    notFoundDescription: t('noResultsDescription'),

    zeroCopyTitle: t('detailZeroCopyTitle'),
    zeroCopyDescription: t('detailZeroCopyDescription'),
    zeroCopyTag: t('detailZeroCopyTag'),
    sampleTitle: t('detailSampleTitle'),
    sampleDescription: t('detailSampleDescription'),
    sampleCta: t('detailSampleCta'),

    tabsLabel: t('detailTabsLabel'),
    overviewTab: t('detailOverviewTab'),
    findingsTab: t('detailFindingsTab'),
    historyTab: t('detailHistoryTab'),
    configTab: t('detailConfigTab'),
    openCount: t('detailOpenCount'),

    scanNowCta: t('detailScanNowCta'),
    scanningLabel: t('scanningLabel'),
    configureCta: t('detailConfigureCta'),
    connectCta: t('detailConnectCta'),
    connectingLabel: t('connectingLabel'),

    connStatusConnected: t('connStatusConnected'),
    connStatusOff: t('connStatusOff'),

    statNames: {
      piiTypes: t('statPiiTypes'),
      itemsWithPii: t('statItemsWithPii'),
      locations: t('statLocations'),
      riskLevel: t('statRiskLevel'),
      lastScan: t('statLastScan'),
      discovered: t('statDiscovered'),
    },
    riskNames: {
      high: t('riskHigh'),
      medium: t('riskMedium'),
      low: t('riskLow'),
      unknown: t('riskUnknown'),
    },

    whereFeedsTitle: t('detailWhereFeedsTitle'),
    whereFeedsDescription: t('detailWhereFeedsDescription'),
    feedsDataMap: t('detailWhereFeedsDataMap'),
    feedsRopa: t('detailWhereFeedsRopa'),
    feedsDpdp: t('detailWhereFeedsDpdp'),
    feedsRisk: t('detailWhereFeedsRisk'),
  } as const;
}

/** The findings table and the scan log. */
function buildEvidenceMessages(t: Translate<'data-sources'>) {
  return {
    findingsLocation: t('detailFindingsLocation'),
    findingsIdentifier: t('detailFindingsIdentifier'),
    findingsItems: t('detailFindingsItems'),
    findingsConfidence: t('detailFindingsConfidence'),
    findingsSample: t('detailFindingsSample'),
    findingsStatus: t('detailFindingsStatus'),
    findingStatusOpen: t('findingStatusOpen'),
    findingStatusAcknowledged: t('findingStatusAcknowledged'),
    findingStatusSample: t('findingStatusSample'),
    findingsCleanTitle: t('findingsCleanTitle'),
    findingsCleanDescription: t('findingsCleanDescription'),
    findingsEmptyTitle: t('findingsEmptyTitle'),
    findingsEmptyDescription: t('findingsEmptyDescription'),
    findingsSampleNotice: t('findingsSampleNotice'),
    findingsFooterMasked: t('findingsFooterMasked'),
    findingsOpenExternalLabel: t('findingsOpenExternalLabel'),
    toastOpenExternal: t('toastOpenExternal'),

    historyWhen: t('detailHistoryWhen'),
    historyType: t('detailHistoryType'),
    historyDuration: t('detailHistoryDuration'),
    historyItems: t('detailHistoryItems'),
    historyDelta: t('detailHistoryDelta'),
    historyStatus: t('detailHistoryStatus'),
    runStatusComplete: t('runStatusComplete'),
    runStatusPartial: t('runStatusPartial'),
    historyEmptyTitle: t('historyEmptyTitle'),
    historyEmptyDescription: t('historyEmptyDescription'),
    historyReportLabel: t('historyReportLabel'),
    historyRetention: t('detailHistoryRetention'),
    toastScanReport: t('toastScanReport'),
  } as const;
}

/** The configuration tab: connection, scope, scan settings and the danger zone. */
function buildConfigMessages(t: Translate<'data-sources'>) {
  return {
    configConnectionTitle: t('configConnectionTitle'),
    configConnectionDescription: t('configConnectionDescription'),
    configConnectionOffDescription: t('configConnectionOffDescription'),
    configReadOnlyVerified: t('configReadOnlyVerified'),
    configUrlLabel: t('configUrlLabel'),
    configUrlPlaceholder: t('configUrlPlaceholder'),
    configAccountLabel: t('configAccountLabel'),
    configAccountPlaceholder: t('configAccountPlaceholder'),
    configSecretLabel: t('configSecretLabel'),
    configSecretOffLabel: t('configSecretOffLabel'),
    configAuthLabel: t('configAuthLabel'),
    configScopeTitle: t('configScopeTitle'),
    configScopeDescription: t('configScopeDescription'),
    configSamplingTitle: t('configSamplingTitle'),
    samplingTitle: t('samplingTitle'),
    samplingQuick: t('samplingQuick'),
    samplingStandard: t('samplingStandard'),
    samplingDeep: t('samplingDeep'),
    scheduleTitle: t('scheduleTitle'),
    scheduleDaily: t('scheduleDaily'),
    scheduleWeekly: t('scheduleWeekly'),
    scheduleManual: t('scheduleManual'),
    detectorsTitle: t('detectorsTitle'),
    testConnection: t('wizardTestConnection'),
    testingLabel: t('wizardTestingLabel'),
    configSaveCta: t('configSaveCta'),
    configSaveHint: t('configSaveHint'),
    configConnectHint: t('configConnectHint'),
    configStoreTitle: t('configStoreTitle'),
    storeLocations: t('storeLocations'),
    storeCounts: t('storeCounts'),
    storeMasked: t('storeMasked'),
    storeRaw: t('storeRaw'),
    storeCredentials: t('storeCredentials'),
    storeYes: t('storeYes'),
    storeNever: t('storeNever'),
    storeEncrypted: t('storeEncrypted'),
    configDangerTitle: t('configDangerTitle'),
    configDangerDescription: t('configDangerDescription'),
    configDisconnectCta: t('configDisconnectCta'),
    configDisconnectConfirm: t('configDisconnectConfirm'),
    toastScopeUpdated: t('toastScopeUpdated'),
    toastTestOk: t('toastTestOk'),
    toastConfigSaved: t('toastConfigSaved'),
    toastDisconnected: t('toastDisconnected'),
    toastScanComplete: t('toastScanComplete'),
    toastConnected: t('toastConnectStarted'),

    detectorNames: {
      aadhaar: t('detectorAadhaar'),
      pan: t('detectorPan'),
      gstin: t('detectorGstin'),
      phone: t('detectorPhone'),
      email: t('detectorEmail'),
      bank: t('detectorBank'),
      address: t('detectorAddress'),
      dob: t('detectorDob'),
    },
    scanProgressLabel: t('scanProgressLabel'),
  } as const;
}

export function buildSourceDetailMessages(t: Translate<'data-sources'>): SourceDetailMessages {
  return {
    ...buildShellMessages(t),
    ...buildEvidenceMessages(t),
    ...buildConfigMessages(t),
  };
}
