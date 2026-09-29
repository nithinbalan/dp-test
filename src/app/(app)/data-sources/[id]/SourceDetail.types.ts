/** Page-local — copy for the source detail view, resolved server-side in page.tsx. */
import type { RiskLevel, SourceStatKind } from '@shared/mock/source-details';

export type SourceDetailMessages = {
  backLabel: string;
  notFoundTitle: string;
  notFoundDescription: string;

  zeroCopyTitle: string;
  zeroCopyDescription: string;
  zeroCopyTag: string;
  sampleTitle: string;
  sampleDescription: string;
  sampleCta: string;

  tabsLabel: string;
  overviewTab: string;
  findingsTab: string;
  historyTab: string;
  configTab: string;
  openCount: string;

  scanNowCta: string;
  scanningLabel: string;
  configureCta: string;
  connectCta: string;
  connectingLabel: string;

  connStatusConnected: string;
  connStatusOff: string;

  statNames: Readonly<Record<SourceStatKind, string>>;
  riskNames: Readonly<Record<RiskLevel, string>>;

  whereFeedsTitle: string;
  whereFeedsDescription: string;
  feedsDataMap: string;
  feedsRopa: string;
  feedsDpdp: string;
  feedsRisk: string;

  findingsLocation: string;
  findingsIdentifier: string;
  findingsItems: string;
  findingsConfidence: string;
  findingsSample: string;
  findingsStatus: string;
  findingStatusOpen: string;
  findingStatusAcknowledged: string;
  findingStatusSample: string;
  findingsCleanTitle: string;
  findingsCleanDescription: string;
  findingsEmptyTitle: string;
  findingsEmptyDescription: string;
  findingsSampleNotice: string;
  findingsFooterMasked: string;
  findingsOpenExternalLabel: string;
  toastOpenExternal: string;

  historyWhen: string;
  historyType: string;
  historyDuration: string;
  historyItems: string;
  historyDelta: string;
  historyStatus: string;
  runStatusComplete: string;
  runStatusPartial: string;
  historyEmptyTitle: string;
  historyEmptyDescription: string;
  historyReportLabel: string;
  historyRetention: string;
  toastScanReport: string;

  configConnectionTitle: string;
  configConnectionDescription: string;
  configConnectionOffDescription: string;
  configReadOnlyVerified: string;
  configUrlLabel: string;
  configUrlPlaceholder: string;
  configAccountLabel: string;
  configAccountPlaceholder: string;
  configSecretLabel: string;
  configSecretOffLabel: string;
  configAuthLabel: string;
  configScopeTitle: string;
  configScopeDescription: string;
  configSamplingTitle: string;
  samplingTitle: string;
  samplingQuick: string;
  samplingStandard: string;
  samplingDeep: string;
  scheduleTitle: string;
  scheduleDaily: string;
  scheduleWeekly: string;
  scheduleManual: string;
  detectorsTitle: string;
  testConnection: string;
  testingLabel: string;
  configSaveCta: string;
  configSaveHint: string;
  configConnectHint: string;
  configStoreTitle: string;
  storeLocations: string;
  storeCounts: string;
  storeMasked: string;
  storeRaw: string;
  storeCredentials: string;
  storeYes: string;
  storeNever: string;
  storeEncrypted: string;
  configDangerTitle: string;
  configDangerDescription: string;
  configDisconnectCta: string;
  configDisconnectConfirm: string;
  toastScopeUpdated: string;
  toastTestOk: string;
  toastConfigSaved: string;
  toastDisconnected: string;
  toastScanComplete: string;
  toastConnected: string;

  detectorNames: Readonly<Record<string, string>>;
  scanProgressLabel: string;
};
