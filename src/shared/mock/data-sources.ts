/**
 * MOCK DATA — see the note in `workspace.ts`. A workspace's roster of connected
 * (and not-yet-connected) sources.
 *
 * Two things about the shape are load-bearing rather than cosmetic:
 *
 * 1. `children` — a cloud account is not one source. Pointing the scanner at an
 *    AWS account discovers the buckets and managed databases inside it, and each
 *    of those is scanned, tagged and risk-rated on its own. Flattening them would
 *    lose which account a finding came from; nesting them is what the tree view
 *    on the register renders.
 * 2. `pii` is four-valued, not a boolean. "Not scanned yet" and "scanned, clean"
 *    look identical as `false` and mean opposite things to someone deciding where
 *    to spend the week.
 */
import type { ConnectorCategory } from './connectors';

export type SourceStatus = 'connected' | 'off';

/** `na` = never scanned. `no` = scanned and clean. `risk` = sensitive identifiers present. */
export type SourcePii = 'na' | 'no' | 'yes' | 'risk';

/** An identifier type a scan found. `isSensitive` marks the DPDP special categories. */
export type PiiCategory = { label: string; isSensitive: boolean };

/** What the first scan will report once a not-yet-connected source is connected. */
export type ConnectResult = {
  pii: SourcePii;
  categories: readonly PiiCategory[];
};

export type DataSource = {
  id: string;
  connectorId: string;
  name: string;
  /** The second line on the row — where it points and how it is scanned. */
  description: string;
  type: ConnectorCategory;
  status: SourceStatus;
  pii: SourcePii;
  categories: readonly PiiCategory[];
  /** Coarse "when", e.g. "Today 04:00". */
  lastScanLabel: string;
  /** What that scan did, e.g. "Scan complete · no changes". */
  lastScanDetail: string;
  datasetCount: number;
  /** Sources discovered inside this one — cloud accounts only. */
  children?: readonly DataSource[] | undefined;
  connectResult?: ConnectResult | undefined;
};

function pii(label: string, isSensitive = false): PiiCategory {
  return { label, isSensitive };
}

const AWS_CHILDREN: readonly DataSource[] = [
  {
    id: 'src-6-uploads',
    connectorId: 'aws',
    name: 's3://customer-uploads',
    description: 'S3 bucket · ap-south-1 · 18K objects',
    type: 'cloud',
    status: 'connected',
    pii: 'risk',
    categories: [pii('Aadhaar scans', true), pii('PAN', true), pii('Name')],
    lastScanLabel: 'Today 04:10',
    lastScanDetail: 'Scan complete · 612 objects flagged',
    datasetCount: 1,
  },
  {
    id: 'src-6-rds',
    connectorId: 'aws',
    name: 'RDS · mysql-prod',
    description: 'Managed MySQL · read replica · 14 tables',
    type: 'cloud',
    status: 'connected',
    pii: 'yes',
    categories: [pii('Bank a/c', true), pii('DOB'), pii('Address')],
    lastScanLabel: 'Today 04:15',
    lastScanDetail: 'Scan complete · no changes',
    datasetCount: 2,
  },
  {
    id: 'src-6-backups',
    connectorId: 'aws',
    name: 's3://db-backups',
    description: 'S3 bucket · nightly production dumps',
    type: 'cloud',
    status: 'connected',
    pii: 'risk',
    categories: [pii('Bank a/c', true), pii('Name'), pii('Phone')],
    lastScanLabel: 'Today 04:16',
    lastScanDetail: 'Scan complete · unencrypted dumps',
    datasetCount: 1,
  },
];

export const DATA_SOURCES: readonly DataSource[] = [
  {
    id: 'src-1',
    connectorId: 'jira',
    name: 'Jira',
    description: 'Atlassian Cloud · 12 projects · daily 04:00 · standard sampling',
    type: 'app',
    status: 'connected',
    pii: 'risk',
    categories: [pii('Aadhaar', true), pii('PAN', true), pii('Phone'), pii('Email')],
    lastScanLabel: 'Today 04:00',
    lastScanDetail: 'Scan complete · no changes',
    datasetCount: 2,
  },
  {
    id: 'src-2',
    connectorId: 'zoho-crm',
    name: 'Zoho CRM',
    description: 'crm.zoho.in · 7 modules · daily 04:05 · standard sampling',
    type: 'app',
    status: 'connected',
    pii: 'yes',
    categories: [
      pii('Name'),
      pii('Email'),
      pii('Phone'),
      pii('Address'),
      pii('GSTIN'),
      pii('PAN', true),
    ],
    lastScanLabel: 'Today 04:05',
    lastScanDetail: 'Scan complete · no changes',
    datasetCount: 3,
  },
  {
    id: 'src-3',
    connectorId: 'm365',
    name: 'Microsoft 365',
    description: 'Exchange, SharePoint & OneDrive · 22 mailboxes and sites',
    type: 'app',
    status: 'connected',
    pii: 'yes',
    categories: [pii('Salary', true), pii('ID proofs', true), pii('Address'), pii('Email')],
    lastScanLabel: 'Today 04:00',
    lastScanDetail: 'Scan complete · no changes',
    datasetCount: 4,
  },
  {
    id: 'src-4',
    connectorId: 'github',
    name: 'GitHub',
    description: 'github.com/jethur · 42 repositories · 8 branches deep',
    type: 'app',
    status: 'connected',
    pii: 'risk',
    categories: [pii('API keys', true), pii('Email'), pii('Phone')],
    lastScanLabel: '3 days ago',
    lastScanDetail: 'Scan complete · 2 new keys',
    datasetCount: 1,
  },
  {
    id: 'src-5',
    connectorId: 'figma',
    name: 'Figma',
    description: 'Team files · 12 files · daily 04:20 · quick sampling',
    type: 'app',
    status: 'connected',
    pii: 'no',
    categories: [],
    lastScanLabel: 'Yesterday 04:20',
    lastScanDetail: 'Scan complete · clean',
    datasetCount: 0,
  },
  {
    id: 'src-6',
    connectorId: 'aws',
    name: 'AWS · account 4821-…-77',
    description: 'ap-south-1 · IAM role · 9 buckets and 2 RDS instances',
    type: 'cloud',
    status: 'connected',
    pii: 'risk',
    categories: [pii('Aadhaar scans', true), pii('Bank a/c', true), pii('PAN', true)],
    lastScanLabel: 'Today 04:00',
    lastScanDetail: 'Account sweep complete · no new sources',
    datasetCount: 4,
    children: AWS_CHILDREN,
  },
  {
    id: 'src-7',
    connectorId: 'mysql',
    name: 'MySQL · billing-db',
    description: '10.0.2.11:3306 · 9 tables · daily 04:30 · standard sampling',
    type: 'db',
    status: 'connected',
    pii: 'yes',
    categories: [pii('Name'), pii('GSTIN'), pii('Address')],
    lastScanLabel: 'Today 04:30',
    lastScanDetail: 'Scan complete · no changes',
    datasetCount: 2,
  },
  {
    id: 'src-8',
    connectorId: 'mongodb',
    name: 'MongoDB · cluster0',
    description: 'Atlas · Mumbai · 4 collections · daily 04:35',
    type: 'db',
    status: 'connected',
    pii: 'no',
    categories: [],
    lastScanLabel: 'Today 04:35',
    lastScanDetail: 'Scan complete · clean',
    datasetCount: 0,
  },
  {
    id: 'src-9',
    connectorId: 'mssql',
    name: 'Microsoft SQL Server',
    description: 'ERP database · read-only login not yet supplied',
    type: 'db',
    status: 'off',
    pii: 'na',
    categories: [],
    lastScanLabel: 'Never',
    lastScanDetail: 'No scans yet',
    datasetCount: 0,
    connectResult: { pii: 'yes', categories: [pii('Name'), pii('Phone'), pii('Bank a/c', true)] },
  },
  {
    id: 'src-10',
    connectorId: 'azure',
    name: 'Microsoft Azure',
    description: 'Blob containers and SQL databases · not connected',
    type: 'cloud',
    status: 'off',
    pii: 'na',
    categories: [],
    lastScanLabel: 'Never',
    lastScanDetail: 'No scans yet',
    datasetCount: 0,
    connectResult: { pii: 'yes', categories: [pii('Email'), pii('Phone')] },
  },
  {
    id: 'src-11',
    connectorId: 'oci',
    name: 'Oracle Cloud',
    description: 'Object Storage buckets · not connected',
    type: 'cloud',
    status: 'off',
    pii: 'na',
    categories: [],
    lastScanLabel: 'Never',
    lastScanDetail: 'No scans yet',
    datasetCount: 0,
    connectResult: { pii: 'no', categories: [] },
  },
];

/** Looks through discovered children too — a child id is a valid detail route. */
export function findSource(sources: readonly DataSource[], id: string): DataSource | undefined {
  for (const source of sources) {
    if (source.id === id) return source;
    const child = source.children?.find((candidate) => candidate.id === id);
    if (child) return child;
  }
  return undefined;
}

export function getDataSource(id: string): DataSource | undefined {
  return findSource(DATA_SOURCES, id);
}

export function countConnected(sources: readonly DataSource[]): number {
  return sources.filter((source) => source.status === 'connected').length;
}

export function countWithPii(sources: readonly DataSource[]): number {
  return sources.filter((source) => source.pii === 'yes' || source.pii === 'risk').length;
}

export function countDatasets(sources: readonly DataSource[]): number {
  return sources.reduce(
    (total, source) =>
      total +
      source.datasetCount +
      (source.children?.reduce((sum, child) => sum + child.datasetCount, 0) ?? 0),
    0,
  );
}

/** Percentage of the register that is actually connected — the coverage KPI. */
export function connectedCoverage(sources: readonly DataSource[]): number {
  if (sources.length === 0) return 0;
  return Math.round((countConnected(sources) / sources.length) * 100);
}
