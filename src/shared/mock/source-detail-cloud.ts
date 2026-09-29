/**
 * MOCK DATA — the AWS account and the three sources discovered inside it.
 *
 * Kept together because that is how they are read: the account's own findings
 * are pointers at its children, and a finding on the account only means anything
 * next to the bucket or database it came from.
 */
import type { SourceDetailData } from './source-details';
import { finding, pii, risk, run, scope, stat } from './source-detail-builders';

export const AWS: SourceDetailData = {
  isSample: false,
  stats: [
    stat('discovered', '10', '9 buckets · 2 RDS'),
    stat('piiTypes', '5'),
    stat('locations', '2', 'high-risk sources'),
    risk('high', 'Aadhaar and full dumps'),
    stat('lastScan', 'Today 04:00', 'account sweep · next daily 04:00 IST'),
  ],
  findings: [
    finding(
      'aws-1',
      's3://customer-uploads',
      'open the discovered source for detail',
      [pii('Aadhaar scans', true), pii('PAN', true)],
      '18K',
      '—',
      'see source',
      'open',
    ),
    finding(
      'aws-2',
      's3://db-backups',
      'full nightly dumps',
      [pii('Bank a/c', true)],
      '12',
      '—',
      'see source',
      'open',
    ),
    finding(
      'aws-3',
      'RDS · mysql-prod',
      'customers table',
      [pii('Bank a/c', true), pii('DOB')],
      '84K',
      '—',
      'see source',
      'acknowledged',
    ),
  ],
  history: [
    run(
      'aws-h1',
      'Today',
      '04:00 IST',
      'ACCOUNT SWEEP',
      '2m 10s',
      '9 buckets · 2 RDS',
      '+0 new sources',
      true,
    ),
    run(
      'aws-h2',
      '18 Aug 2026',
      '04:00 IST',
      'ACCOUNT SWEEP',
      '2m 30s',
      '9 buckets · 2 RDS',
      '+1 bucket · terraform-state',
      false,
    ),
    run(
      'aws-h3',
      '12 Aug 2026',
      '15:00 IST',
      'FIRST SWEEP',
      '6m',
      'account 4821-…-77',
      '+10 sources discovered',
      false,
    ),
  ],
  config: {
    url: 'arn:aws:iam::4821…:role/jethur-scan',
    account: '—',
    auth: 'IAM role · ReadOnlyAccess subset',
    scopeLabel: 'services',
    scope: [scope('S3'), scope('RDS'), scope('DynamoDB', false), scope('EBS snapshots', false)],
  },
};

export const AWS_UPLOADS: SourceDetailData = {
  isSample: false,
  stats: [
    stat('piiTypes', '4'),
    stat('itemsWithPii', '612', 'of 2,400 objects sampled'),
    stat('locations', '2', 'prefixes affected'),
    risk('high', 'Aadhaar images'),
    stat('lastScan', 'Today 04:10'),
  ],
  findings: [
    finding(
      'awsu-1',
      'kyc/ prefix',
      'scanned Aadhaar card images (OCR)',
      [pii('Aadhaar scans', true), pii('Name')],
      '540',
      '97%',
      'XXXX XXXX 77••',
      'open',
    ),
    finding(
      'awsu-2',
      'onboarding/ prefix',
      'PAN card photos',
      [pii('PAN', true), pii('Address')],
      '72',
      '94%',
      'masked image',
      'open',
    ),
  ],
  history: [
    run('awsu-h1', 'Today', '04:10 IST', 'SCHEDULED', '3m 05s', '2,400 objects', '+0 new', true),
    run(
      'awsu-h2',
      '12 Aug 2026',
      '15:06 IST',
      'FIRST SCAN',
      '9m',
      '2,000 objects',
      '+612 objects flagged',
      false,
    ),
  ],
  config: {
    url: 's3://customer-uploads',
    account: '—',
    auth: 'Via the AWS account role',
    scopeLabel: 'prefixes',
    scope: [scope('kyc/'), scope('onboarding/'), scope('public/', false)],
  },
};

export const AWS_RDS: SourceDetailData = {
  isSample: false,
  stats: [
    stat('piiTypes', '6'),
    stat('itemsWithPii', '84K', 'rows sampled across 14 tables'),
    stat('locations', '3', 'tables affected'),
    risk('high', 'bank account numbers'),
    stat('lastScan', 'Today 04:15'),
  ],
  findings: [
    finding(
      'awsr-1',
      'customers table',
      '6 PII columns',
      [pii('Bank a/c', true), pii('DOB'), pii('Address')],
      '84K',
      '99%',
      '••••0091',
      'acknowledged',
    ),
    finding(
      'awsr-2',
      'support_tickets',
      'free-text body',
      [pii('Phone'), pii('Email')],
      '9,300',
      '92%',
      '+91 ••••• 22••',
      'open',
    ),
  ],
  history: [
    run('awsr-h1', 'Today', '04:15 IST', 'SCHEDULED', '2m 44s', '84K rows', '+0 new', true),
    run(
      'awsr-h2',
      '12 Aug 2026',
      '15:20 IST',
      'FIRST SCAN',
      '8m',
      '14 tables',
      '+3 tables flagged',
      false,
    ),
  ],
  config: {
    url: 'rds.mysql-prod · ap-south-1',
    account: '—',
    auth: 'Via the AWS account role · read replica',
    scopeLabel: 'tables',
    scope: [
      scope('customers'),
      scope('orders'),
      scope('support_tickets'),
      scope('sessions', false),
    ],
  },
};

export const AWS_BACKUPS: SourceDetailData = {
  isSample: false,
  stats: [
    stat('piiTypes', '3'),
    stat('itemsWithPii', '12', 'archives, all containing full DB copies'),
    stat('locations', '1', 'prefix affected'),
    risk('high', 'unencrypted dumps'),
    stat('lastScan', 'Today 04:16'),
  ],
  findings: [
    finding(
      'awsb-1',
      'nightly/*.sql.gz',
      'full production dumps',
      [pii('Bank a/c', true), pii('Name'), pii('Phone')],
      '12',
      '99%',
      'full row data',
      'open',
    ),
  ],
  history: [
    run('awsb-h1', 'Today', '04:16 IST', 'SCHEDULED', '1m 55s', '12 archives', '+0 new', true),
    run(
      'awsb-h2',
      '12 Aug 2026',
      '15:30 IST',
      'FIRST SCAN',
      '5m',
      '12 archives',
      'dumps contain full PII',
      false,
    ),
  ],
  config: {
    url: 's3://db-backups',
    account: '—',
    auth: 'Via the AWS account role',
    scopeLabel: 'prefixes',
    scope: [scope('nightly/'), scope('weekly/')],
  },
};
