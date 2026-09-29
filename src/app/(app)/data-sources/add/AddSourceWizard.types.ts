/** Page-local — the Add Source wizard's state and the copy it renders. */
import type { Connector } from '@shared/mock/connectors';

export type SamplingDepth = 'quick' | 'standard' | 'deep';
export type ScanSchedule = 'daily' | 'weekly' | 'manual';
/** Scan every database the role can see, or only the ones explicitly picked. */
export type DatabaseMode = 'all' | 'selected';

export type DetectorId =
  'aadhaar' | 'pan' | 'gstin' | 'phone' | 'email' | 'bank' | 'address' | 'dob';

/** The identifiers the DPDP Act treats as special category — flagged in the picker. */
export const SENSITIVE_DETECTORS: readonly DetectorId[] = ['aadhaar', 'pan', 'bank'];

export const ALL_DETECTORS: readonly DetectorId[] = [
  'aadhaar',
  'pan',
  'gstin',
  'phone',
  'email',
  'bank',
  'address',
  'dob',
];

/** Field keys the database form uses. Shared with the review step's target lookup. */
export const DB_FIELD = {
  inputMode: 'dbInputMode',
  host: 'dbHost',
  port: 'dbPort',
  username: 'dbUsername',
  password: 'dbPassword',
  ssl: 'dbSsl',
} as const;

export type AddSourceState = {
  connectorId: string | undefined;
  /** Connection inputs, keyed by `ConnectorField.key` or `DB_FIELD`. */
  values: Readonly<Record<string, string | undefined>>;
  databaseMode: DatabaseMode;
  areDatabasesLoaded: boolean;
  selectedDatabases: readonly string[];
  shouldSaveCredentials: boolean;
  sampling: SamplingDepth;
  schedule: ScanSchedule;
  detectors: readonly DetectorId[];
};

/** Result of the last "test connection" press, shown beside the footer buttons. */
export type ConnectionTest = 'untested' | 'testing' | 'ok' | 'missingFields';

export type StepProps = {
  state: AddSourceState;
  onChange: (patch: Partial<AddSourceState>) => void;
  connector: Connector | undefined;
};

export type AddSourceMessages = {
  refTag: string;
  title: string;
  description: string;
  backToSources: string;
  stepperLabel: string;
  stepConnector: string;
  stepConnect: string;
  stepScan: string;
  stepReview: string;
  stepCount: string;
  cancel: string;
  back: string;
  continueCta: string;

  chooseTitle: string;
  chooseDescription: string;
  searchConnectors: string;
  allCategories: string;
  connectorCount: string;
  matchCount: string;
  oneMatch: string;
  noMatchTitle: string;
  noMatchDescription: string;
  pickHint: string;

  categoryNames: Readonly<Record<'app' | 'cloud' | 'db' | 'file', string>>;
  categoryDescriptions: Readonly<Record<'app' | 'cloud' | 'db' | 'file', string>>;
  groupNames: Readonly<Record<string, string>>;

  connectTitle: string;
  connectDbDescription: string;
  connectDescription: string;
  dbInputModeLabel: string;
  dbInputSeparate: string;
  dbInputConnectionString: string;
  dbHostLabel: string;
  dbHostPlaceholder: string;
  dbPortLabel: string;
  dbUsernameLabel: string;
  dbPasswordLabel: string;
  dbPasswordHint: string;
  dbSslLabel: string;
  dbSslPrefer: string;
  dbSslRequire: string;
  dbSslDisable: string;
  dbPanelTitle: string;
  dbPanelDescription: string;
  dbLoadCta: string;
  dbLoadingLabel: string;
  dbNoneLoaded: string;
  dbModeAll: string;
  dbModeAllDescription: string;
  dbModeSelected: string;
  dbModeSelectedDescription: string;
  dbSelectionLabel: string;
  saveCredentialsLabel: string;
  saveCredentialsDescription: string;
  cloudReadOnlyLabel: string;
  cloudReadOnlyDescription: string;
  testConnection: string;
  testingLabel: string;
  testOk: string;
  testMissingFields: string;
  fieldRequired: string;
  optionalLabel: string;

  scanTitle: string;
  scanDescription: string;
  samplingTitle: string;
  samplingDescription: string;
  samplingQuick: string;
  samplingQuickHint: string;
  samplingStandard: string;
  samplingStandardHint: string;
  samplingDeep: string;
  samplingDeepHint: string;
  scheduleTitle: string;
  scheduleDescription: string;
  scheduleDaily: string;
  scheduleDailyHint: string;
  scheduleWeekly: string;
  scheduleWeeklyHint: string;
  scheduleManual: string;
  scheduleManualHint: string;
  detectorsTitle: string;
  detectorsDescription: string;
  detectorNames: Readonly<Record<DetectorId, string>>;

  reviewTitle: string;
  reviewDescription: string;
  reviewConnector: string;
  reviewTarget: string;
  reviewDatabases: string;
  reviewDatabasesAll: string;
  reviewDatabasesNone: string;
  reviewSampling: string;
  reviewSchedule: string;
  reviewDetectors: string;
  reviewDetectorCount: string;
  reviewCredentials: string;
  credentialsSaved: string;
  credentialsNotStored: string;
  readOnlyAccessLabel: string;
  readOnlyAccessDescription: string;
  submit: string;
  submitting: string;
  toastAdded: string;
};
