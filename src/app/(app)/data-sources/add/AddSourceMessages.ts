/** Resolves the wizard's copy server-side. See `AddSourceWizard.types`. */
import type { Translate } from '@shared/lib';
import type { AddSourceMessages } from './AddSourceWizard.types';

/** Chrome: the shell, the stepper and the footer buttons. */
function buildShellMessages(t: Translate<'data-sources'>) {
  return {
    refTag: t('wizardRefTag'),
    title: t('wizardTitle'),
    description: t('wizardDescription'),
    backToSources: t('wizardBackToSources'),
    stepperLabel: t('wizardStepperLabel'),
    stepConnector: t('wizardStepConnector'),
    stepConnect: t('wizardStepConnect'),
    stepScan: t('wizardStepScan'),
    stepReview: t('wizardStepReview'),
    stepCount: t('wizardStepCount'),
    cancel: t('wizardCancel'),
    back: t('wizardBack'),
    continueCta: t('wizardContinue'),

    chooseTitle: t('wizardChooseTitle'),
    chooseDescription: t('wizardChooseDescription'),
    searchConnectors: t('wizardSearchConnectors'),
    allCategories: t('wizardAllCategories'),
    connectorCount: t('wizardConnectorCount'),
    matchCount: t('wizardMatchCount'),
    oneMatch: t('wizardOneMatch'),
    noMatchTitle: t('wizardNoMatchTitle'),
    noMatchDescription: t('wizardNoMatchDescription'),
    pickHint: t('wizardPickHint'),

    categoryNames: {
      app: t('catAppName'),
      cloud: t('catCloudName'),
      db: t('catDbName'),
      file: t('catFileName'),
    },
    categoryDescriptions: {
      app: t('catAppDescription'),
      cloud: t('catCloudDescription'),
      db: t('catDbDescription'),
      file: t('catFileDescription'),
    },
    groupNames: {
      accounting: t('groupAccounting'),
      hr: t('groupHr'),
      crm: t('groupCrm'),
      payments: t('groupPayments'),
      support: t('groupSupport'),
      communication: t('groupCommunication'),
      marketing: t('groupMarketing'),
      ecommerce: t('groupEcommerce'),
      kyc: t('groupKyc'),
      engineering: t('groupEngineering'),
      storage: t('groupStorage'),
      other: t('groupOther'),
    },
  } as const;
}

/** Step 2 — the connection form, in both its database and generic shapes. */
function buildConnectionMessages(t: Translate<'data-sources'>) {
  return {
    connectTitle: t('wizardConnectTitle'),
    connectDbDescription: t('wizardConnectDbDescription'),
    connectDescription: t('wizardConnectDescription'),
    dbInputModeLabel: t('dbInputModeLabel'),
    dbInputSeparate: t('dbInputSeparate'),
    dbInputConnectionString: t('dbInputConnectionString'),
    dbHostLabel: t('dbHostLabel'),
    dbHostPlaceholder: t('dbHostPlaceholder'),
    dbPortLabel: t('dbPortLabel'),
    dbUsernameLabel: t('dbUsernameLabel'),
    dbPasswordLabel: t('dbPasswordLabel'),
    dbPasswordHint: t('dbPasswordHint'),
    dbSslLabel: t('dbSslLabel'),
    dbSslPrefer: t('dbSslPrefer'),
    dbSslRequire: t('dbSslRequire'),
    dbSslDisable: t('dbSslDisable'),
    dbPanelTitle: t('dbPanelTitle'),
    dbPanelDescription: t('dbPanelDescription'),
    dbLoadCta: t('dbLoadCta'),
    dbLoadingLabel: t('dbLoadingLabel'),
    dbNoneLoaded: t('dbNoneLoaded'),
    dbModeAll: t('dbModeAll'),
    dbModeAllDescription: t('dbModeAllDescription'),
    dbModeSelected: t('dbModeSelected'),
    dbModeSelectedDescription: t('dbModeSelectedDescription'),
    dbSelectionLabel: t('dbSelectionLabel'),
    saveCredentialsLabel: t('saveCredentialsLabel'),
    saveCredentialsDescription: t('saveCredentialsDescription'),
    cloudReadOnlyLabel: t('cloudReadOnlyLabel'),
    cloudReadOnlyDescription: t('cloudReadOnlyDescription'),
    testConnection: t('wizardTestConnection'),
    testingLabel: t('wizardTestingLabel'),
    testOk: t('wizardTestOk'),
    testMissingFields: t('wizardTestMissingFields'),
    fieldRequired: t('wizardFieldRequired'),
    optionalLabel: t('optionalLabel'),
  } as const;
}

/** Steps 3 and 4 — scan setup and the review summary. */
function buildScanAndReviewMessages(t: Translate<'data-sources'>) {
  return {
    scanTitle: t('wizardScanTitle'),
    scanDescription: t('wizardScanDescription'),
    samplingTitle: t('samplingTitle'),
    samplingDescription: t('samplingDescription'),
    samplingQuick: t('samplingQuick'),
    samplingQuickHint: t('samplingQuickHint'),
    samplingStandard: t('samplingStandard'),
    samplingStandardHint: t('samplingStandardHint'),
    samplingDeep: t('samplingDeep'),
    samplingDeepHint: t('samplingDeepHint'),
    scheduleTitle: t('scheduleTitle'),
    scheduleDescription: t('scheduleDescription'),
    scheduleDaily: t('scheduleDaily'),
    scheduleDailyHint: t('scheduleDailyHint'),
    scheduleWeekly: t('scheduleWeekly'),
    scheduleWeeklyHint: t('scheduleWeeklyHint'),
    scheduleManual: t('scheduleManual'),
    scheduleManualHint: t('scheduleManualHint'),
    detectorsTitle: t('detectorsTitle'),
    detectorsDescription: t('detectorsDescription'),
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

    reviewTitle: t('wizardReviewTitle'),
    reviewDescription: t('wizardReviewDescription'),
    reviewConnector: t('reviewConnector'),
    reviewTarget: t('reviewTarget'),
    reviewDatabases: t('reviewDatabases'),
    reviewDatabasesAll: t('reviewDatabasesAll'),
    reviewDatabasesNone: t('reviewDatabasesNone'),
    reviewSampling: t('reviewSampling'),
    reviewSchedule: t('reviewSchedule'),
    reviewDetectors: t('reviewDetectors'),
    reviewDetectorCount: t('reviewDetectorCount'),
    reviewCredentials: t('reviewCredentials'),
    credentialsSaved: t('credentialsSaved'),
    credentialsNotStored: t('credentialsNotStored'),
    readOnlyAccessLabel: t('readOnlyAccessLabel'),
    readOnlyAccessDescription: t('readOnlyAccessDescription'),
    submit: t('wizardSubmit'),
    submitting: t('wizardSubmitting'),
    toastAdded: t('wizardToastAdded'),
  } as const;
}

export function buildAddSourceMessages(t: Translate<'data-sources'>): AddSourceMessages {
  return {
    ...buildShellMessages(t),
    ...buildConnectionMessages(t),
    ...buildScanAndReviewMessages(t),
  };
}
