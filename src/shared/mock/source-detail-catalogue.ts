/**
 * MOCK DATA — the databases and the never-scanned sources, plus the id-keyed map
 * every detail lookup goes through. Anything missing from it falls back to a
 * generic detail derived from the row (`source-details.ts`).
 */
import type { SourceDetailData, SourceStat } from './source-details';
import { finding, pii, risk, run, scope, stat } from './source-detail-builders';
import { FIGMA, GITHUB, JIRA, M365, ZOHO } from './source-detail-apps';
import { AWS, AWS_BACKUPS, AWS_RDS, AWS_UPLOADS } from './source-detail-cloud';

const MYSQL: SourceDetailData = {
  isSample: false,
  stats: [
    stat('piiTypes', '3'),
    stat('itemsWithPii', '22K', 'rows sampled across 9 tables'),
    stat('locations', '2', 'tables affected'),
    risk('medium'),
    stat('lastScan', 'Today 04:30', 'next: daily 04:30 IST'),
  ],
  findings: [
    finding(
      'my-1',
      'invoices table',
      'billing-db.invoices · 3 columns',
      [pii('Name'), pii('GSTIN'), pii('Address')],
      '22K',
      '98%',
      '32AAA••••',
      'acknowledged',
    ),
    finding(
      'my-2',
      'customers_bak table',
      'forgotten 2024 backup table',
      [pii('Name'), pii('Address')],
      '6,100',
      '96%',
      'masked',
      'open',
    ),
  ],
  history: [
    run('my-h1', 'Today', '04:30 IST', 'SCHEDULED', '1m 42s', '22K rows', '+0 new', true),
    run(
      'my-h2',
      '16 Aug 2026',
      '04:30 IST',
      'SCHEDULED',
      '1m 51s',
      '21K rows',
      '+1 table · customers_bak',
      false,
    ),
    run('my-h3', '11 Aug 2026', '13:10 IST', 'FIRST SCAN', '4m', '9 tables', 'baseline', true),
  ],
  config: {
    url: 'mysql://10.0.2.11:3306',
    account: 'readonly_scanner',
    auth: 'Read-only DB user · SSL',
    scopeLabel: 'databases',
    scope: [scope('billing'), scope('archive_2024'), scope('staging', false)],
  },
};

const MONGO: SourceDetailData = {
  isSample: false,
  stats: [
    stat('piiTypes', '0'),
    stat('itemsWithPii', '1.2M', 'documents sampled across 4 collections'),
    stat('locations', '0', 'collections affected'),
    risk('low', 'clean'),
    stat('lastScan', 'Today 04:35', 'next: daily 04:35 IST'),
  ],
  findings: [],
  history: [
    run('mg-h1', 'Today', '04:35 IST', 'SCHEDULED', '2m 20s', '1.2M docs', '+0 new', true),
    run(
      'mg-h2',
      '10 Aug 2026',
      '11:00 IST',
      'FIRST SCAN',
      '6m',
      '4 collections',
      'clean baseline',
      true,
    ),
  ],
  config: {
    url: 'mongodb+srv://cluster0.mumbai',
    account: 'readonly_scanner',
    auth: 'Atlas read-only role',
    scopeLabel: 'collections',
    scope: [scope('sessions'), scope('events'), scope('cache', false), scope('logs')],
  },
};

/** Never-scanned sources: illustrative rows, always flagged as a sample. */
const UNSCANNED_STATS: readonly SourceStat[] = [
  stat('piiTypes', '—', 'connect to scan'),
  stat('itemsWithPii', '—'),
  stat('locations', '—'),
  risk('unknown', 'unknown until scanned'),
  stat('lastScan', 'Never', 'no scans yet'),
];

const MSSQL: SourceDetailData = {
  isSample: true,
  sampleNote:
    'Connect your SQL Server with a read-only login to replace this sample with your real findings.',
  stats: UNSCANNED_STATS,
  findings: [
    finding(
      'ms-1',
      'dbo.Customers (sample)',
      'typical ERP customer master',
      [pii('Name'), pii('Phone'), pii('Bank a/c', true)],
      '~',
      '—',
      'what a match looks like',
      'sample',
    ),
    finding(
      'ms-2',
      'dbo.Employees (sample)',
      'typical HR table',
      [pii('Address'), pii('Email')],
      '~',
      '—',
      'what a match looks like',
      'sample',
    ),
  ],
  history: [],
  config: {
    url: '',
    account: '',
    auth: 'Read-only login recommended',
    scopeLabel: 'databases',
    scope: [],
  },
};

const AZURE: SourceDetailData = {
  isSample: true,
  sampleNote:
    'Connect your Azure account and we auto-discover Blob containers and SQL databases — this sample shows the shape of the results.',
  stats: UNSCANNED_STATS,
  findings: [
    finding(
      'az-1',
      'blob://exports (sample)',
      'typical export container',
      [pii('Email'), pii('Phone')],
      '~',
      '—',
      'what a match looks like',
      'sample',
    ),
    finding(
      'az-2',
      'SQL · app-db (sample)',
      'typical users table',
      [pii('Name'), pii('DOB')],
      '~',
      '—',
      'what a match looks like',
      'sample',
    ),
  ],
  history: [],
  config: {
    url: '',
    account: '',
    auth: 'Entra app · Reader role',
    scopeLabel: 'services',
    scope: [],
  },
};

const OCI: SourceDetailData = {
  isSample: true,
  sampleNote:
    'Connect Oracle Cloud and we auto-discover Object Storage buckets — this sample shows the shape of the results.',
  stats: UNSCANNED_STATS,
  findings: [
    finding(
      'oci-1',
      'bucket: invoices (sample)',
      'typical finance bucket',
      [pii('GSTIN'), pii('Name')],
      '~',
      '—',
      'what a match looks like',
      'sample',
    ),
  ],
  history: [],
  config: {
    url: '',
    account: '',
    auth: 'API key · read-only policy',
    scopeLabel: 'buckets',
    scope: [],
  },
};

export const SOURCE_DETAIL_CATALOGUE: Readonly<Record<string, SourceDetailData | undefined>> = {
  'src-1': JIRA,
  'src-2': ZOHO,
  'src-3': M365,
  'src-4': GITHUB,
  'src-5': FIGMA,
  'src-6': AWS,
  'src-6-uploads': AWS_UPLOADS,
  'src-6-rds': AWS_RDS,
  'src-6-backups': AWS_BACKUPS,
  'src-7': MYSQL,
  'src-8': MONGO,
  'src-9': MSSQL,
  'src-10': AZURE,
  'src-11': OCI,
};
