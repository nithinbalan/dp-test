/**
 * MOCK DATA — the connector entries themselves. Split out of `connectors.ts` so
 * the types, ordering and lookup helpers stay readable next to a list this long.
 *
 * Every app entry stays a one-liner through `app()`, which fills in the generic
 * REST credentials form. Only connectors that genuinely need a different form —
 * clouds, file stores, the databases — spell their fields out.
 */
import type { Connector, ConnectorDatabase, ConnectorField, ConnectorGroup } from './connectors';

function text(key: string, label: string, placeholder: string, isRequired = false): ConnectorField {
  return { key, label, control: 'text', placeholder, isRequired };
}

function secret(key: string, label: string, isRequired = false): ConnectorField {
  return { key, label, control: 'password', isRequired };
}

function choice(key: string, label: string, options: readonly string[]): ConnectorField {
  return { key, label, control: 'select', options, isRequired: false };
}

function number(key: string, label: string, placeholder: string): ConnectorField {
  return { key, label, control: 'number', placeholder, isRequired: true };
}

/** The credentials form every SaaS app gets unless it declares its own. */
function restFields(accountUrl: string): readonly ConnectorField[] {
  return [
    text('accountUrl', 'Account / workspace URL', accountUrl),
    choice('access', 'Access', ['Read-only API token', 'OAuth app (read-only)']),
    secret('token', 'API key / token', true),
  ];
}

/** A SaaS / business application. */
function app(
  id: string,
  name: string,
  mark: string,
  group: ConnectorGroup,
  description: string,
  accountUrl = 'https://api.example.com',
): Connector {
  return {
    id,
    name,
    category: 'app',
    group,
    description,
    mark,
    fields: restFields(accountUrl),
  };
}

function db(
  id: string,
  name: string,
  mark: string,
  description: string,
  port: number,
  userHint: string,
  databases: readonly ConnectorDatabase[],
): Connector {
  // Database credentials are the same five inputs on every engine, so the form is
  // rendered from translated copy rather than carried here — see ConnectStep.
  return { id, name, category: 'db', description, mark, fields: [], port, userHint, databases };
}

const DATABASES: readonly Connector[] = [
  db('postgres', 'PostgreSQL', 'P', 'Relational database', 5432, 'readonly_scanner', [
    { name: 'app_db', detail: '41 tables' },
    { name: 'analytics', detail: '18 tables' },
    { name: 'staging', detail: '12 tables' },
    { name: 'archive_2024', detail: '9 tables' },
  ]),
  db('mysql', 'MySQL', 'M', 'Relational database', 3306, 'readonly_scanner', [
    { name: 'billing', detail: '9 tables' },
    { name: 'hr', detail: '14 tables' },
    { name: 'webshop', detail: '22 tables' },
  ]),
  db('mariadb', 'MariaDB', 'M', 'Relational database', 3306, 'readonly_scanner', [
    { name: 'erp', detail: '31 tables' },
    { name: 'crm', detail: '12 tables' },
  ]),
  db('mongodb', 'MongoDB', 'M', 'Document database', 27017, 'readonly_scanner', [
    { name: 'app', detail: '4 collections' },
    { name: 'events', detail: '2 collections' },
  ]),
  db('mssql', 'Microsoft SQL Server', 'S', 'Microsoft SQL Server', 1433, 'scanner_ro', [
    { name: 'erp', detail: '64 tables' },
    { name: 'reports', detail: '11 tables' },
  ]),
  db('oracle-db', 'Oracle Database', 'O', 'Oracle DB / Exadata', 1521, 'jethur_ro', [
    { name: 'ERPPROD', detail: '118 tables' },
    { name: 'HRMS', detail: '27 tables' },
  ]),
];

const CLOUDS: readonly Connector[] = [
  {
    id: 'aws',
    name: 'AWS',
    category: 'cloud',
    description: 'Auto-discover S3, RDS and more',
    mark: 'A',
    fields: [
      choice('accessMethod', 'Access method', ['IAM Role ARN (recommended)', 'Access keys']),
      text('principal', 'Role ARN / Access key', 'arn:aws:iam::4821…:role/jethur-scan', true),
      choice('region', 'Region', ['ap-south-1 (Mumbai)', 'ap-south-2 (Hyderabad)']),
    ],
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    category: 'cloud',
    description: 'Auto-discover Blob and SQL',
    mark: 'A',
    fields: [
      text('tenantId', 'Tenant ID', '', true),
      text('clientId', 'Client ID', '', true),
      secret('clientSecret', 'Client secret', true),
      choice('region', 'Region', ['Central India', 'South India']),
    ],
  },
  {
    id: 'gcp',
    name: 'Google Cloud',
    category: 'cloud',
    description: 'Auto-discover GCS and Cloud SQL',
    mark: 'G',
    fields: [
      text('projectId', 'Project ID', 'company-prod', true),
      secret('serviceAccount', 'Service account JSON', true),
      choice('region', 'Region', ['asia-south1 (Mumbai)', 'asia-south2 (Delhi)']),
    ],
  },
  {
    id: 'oci',
    name: 'Oracle Cloud',
    category: 'cloud',
    description: 'Auto-discover Object Storage',
    mark: 'O',
    fields: [
      text('tenancyOcid', 'Tenancy OCID', '', true),
      text('userOcid', 'User OCID', '', true),
      text('fingerprint', 'API key fingerprint', '', true),
      choice('region', 'Region', ['ap-mumbai-1', 'ap-hyderabad-1']),
    ],
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    category: 'cloud',
    description: 'Spaces and managed databases',
    mark: 'D',
    fields: [
      secret('token', 'API token', true),
      choice('region', 'Region', ['BLR1 (Bengaluru)', 'SGP1 (Singapore)']),
    ],
  },
];

const FILE_STORES: readonly Connector[] = [
  {
    id: 'file-server',
    name: 'File server',
    category: 'file',
    description: 'SMB / SFTP shares',
    mark: 'F',
    fields: [
      choice('protocol', 'Protocol', ['SMB', 'SFTP']),
      text('host', 'Host', 'fileserver.local', true),
      text('share', 'Share / path', '\\\\hr-docs or /srv/share', true),
      text('username', 'Username', 'scanner', true),
      secret('password', 'Password'),
    ],
  },
  {
    id: 'ssh-server',
    name: 'Server',
    category: 'file',
    description: 'Log and config files over SSH',
    mark: 'S',
    fields: [
      text('host', 'Host', '10.0.0.12', true),
      number('port', 'Port', '22'),
      text('username', 'Username', 'scanner', true),
      choice('auth', 'Auth', ['SSH key', 'Password']),
      text('paths', 'Paths to scan', '/var/log, /etc, /home', true),
    ],
  },
  {
    id: 'imap',
    name: 'Email',
    category: 'file',
    description: 'IMAP mailboxes',
    mark: 'E',
    fields: [
      text('host', 'IMAP host', 'imap.company.in', true),
      number('port', 'Port', '993'),
      text('address', 'Email address', 'hr@company.in', true),
      secret('appPassword', 'App password', true),
    ],
  },
  {
    id: 'backups',
    name: 'Backups and archives',
    category: 'file',
    description: 'Zip/tar on local, SFTP or SMB',
    mark: 'B',
    fields: [
      choice('location', 'Location', ['Local path', 'SFTP', 'SMB share']),
      text('path', 'Path', '/backups or \\\\nas\\backups', true),
      text('username', 'Username', 'scanner'),
      secret('password', 'Password'),
    ],
  },
];

const APPS: readonly Connector[] = [
  app(
    'tally',
    'Tally Prime',
    'T',
    'accounting',
    'Accounting, GST and inventory',
    'https://<tally-server>:9000',
  ),
  app('busy', 'Busy Accounting', 'B', 'accounting', 'Accounting and GST for SMEs'),
  app('marg', 'Marg ERP', 'M', 'accounting', 'Distribution, pharma and retail ERP'),
  app(
    'zoho-books',
    'Zoho Books',
    'Z',
    'accounting',
    'Cloud accounting and GST filing',
    'https://books.zoho.in',
  ),
  app('vyapar', 'Vyapar', 'V', 'accounting', 'Billing and accounting for small business'),
  app('cleartax', 'Clear (ClearTax)', 'C', 'accounting', 'GST, TDS and e-invoicing filings'),
  app(
    'sap',
    'SAP / Business One',
    'S',
    'accounting',
    'ERP — finance, supply chain and master data',
  ),
  app('netsuite', 'Oracle NetSuite', 'O', 'accounting', 'Cloud ERP and financials'),
  app('dynamics', 'Microsoft Dynamics 365', 'D', 'accounting', 'ERP and CRM on Dataverse'),
  app('odoo', 'Odoo', 'O', 'accounting', 'Open-source ERP suite'),

  app('darwinbox', 'Darwinbox', 'D', 'hr', 'HRMS — employee master, payroll and documents'),
  app('keka', 'Keka HR', 'K', 'hr', 'HR, payroll and attendance'),
  app('greythr', 'greytHR', 'G', 'hr', 'Payroll, PF/ESI and statutory compliance'),
  app(
    'zoho-people',
    'Zoho People',
    'Z',
    'hr',
    'HRMS and leave management',
    'https://people.zoho.in',
  ),
  app('razorpayx', 'RazorpayX Payroll', 'R', 'hr', 'Payroll, salary accounts and compliance'),
  app('kredily', 'Kredily', 'K', 'hr', 'HRMS and payroll for Indian SMEs'),
  app('successfactors', 'SAP SuccessFactors', 'S', 'hr', 'Core HR and talent management'),
  app('workday', 'Workday', 'W', 'hr', 'HCM and financial management'),

  app(
    'zoho-crm',
    'Zoho CRM',
    'Z',
    'crm',
    'Customer master, leads and deals',
    'https://crm.zoho.in',
  ),
  app('salesforce', 'Salesforce', 'S', 'crm', 'CRM — accounts, contacts and cases'),
  app('freshsales', 'Freshsales', 'F', 'crm', 'CRM and sales pipeline'),
  app('hubspot', 'HubSpot', 'H', 'crm', 'CRM, marketing and sales hub'),
  app('leadsquared', 'LeadSquared', 'L', 'crm', 'Lead capture and sales execution'),
  app('kapture', 'Kapture CX', 'K', 'crm', 'CRM and customer experience'),

  app(
    'razorpay',
    'Razorpay',
    'R',
    'payments',
    'Payments, settlements and customer records',
    'https://api.razorpay.com/v1',
  ),
  app('payu', 'PayU', 'P', 'payments', 'Payment gateway and transaction records'),
  app('cashfree', 'Cashfree Payments', 'C', 'payments', 'Payments, payouts and KYC data'),
  app('ccavenue', 'CCAvenue', 'C', 'payments', 'Payment gateway — card and customer data'),
  app('paytm', 'Paytm for Business', 'P', 'payments', 'Payments and merchant settlements'),
  app('phonepe', 'PhonePe for Business', 'P', 'payments', 'UPI payments and merchant records'),
  app('billdesk', 'BillDesk', 'B', 'payments', 'Bill payments and collections'),
  app('instamojo', 'Instamojo', 'I', 'payments', 'Payments and online store'),
  app('stripe', 'Stripe', 'S', 'payments', 'International payments'),

  app('freshdesk', 'Freshdesk', 'F', 'support', 'Support tickets and customer conversations'),
  app(
    'zoho-desk',
    'Zoho Desk',
    'Z',
    'support',
    'Helpdesk tickets and contacts',
    'https://desk.zoho.in',
  ),
  app('zendesk', 'Zendesk', 'Z', 'support', 'Support tickets and end users'),
  app('freshservice', 'Freshservice', 'F', 'support', 'IT service desk and asset records'),
  app('servicenow', 'ServiceNow', 'S', 'support', 'ITSM — incidents and employee records'),

  app('m365', 'Microsoft 365', 'M', 'communication', 'Exchange, SharePoint, OneDrive and Teams'),
  app(
    'google-workspace',
    'Google Workspace',
    'G',
    'communication',
    'Gmail, Drive, Calendar and Contacts',
  ),
  app('slack', 'Slack', 'S', 'communication', 'Channels, DMs and shared files'),
  app('zoom', 'Zoom', 'Z', 'communication', 'Meetings, recordings and participant lists'),
  app(
    'whatsapp-business',
    'WhatsApp Business API',
    'W',
    'communication',
    'Customer chats via a BSP',
  ),
  app('exotel', 'Exotel', 'E', 'communication', 'Cloud telephony — call logs and recordings'),
  app(
    'myoperator',
    'Knowlarity / MyOperator',
    'K',
    'communication',
    'Cloud call centre and IVR records',
  ),
  app('twilio', 'Twilio', 'T', 'communication', 'SMS, voice and verification logs'),

  app('mailchimp', 'Mailchimp', 'M', 'marketing', 'Email lists and campaign data'),
  app('moengage', 'MoEngage', 'M', 'marketing', 'Customer engagement and user profiles'),
  app('clevertap', 'CleverTap', 'C', 'marketing', 'Product analytics and user profiles'),
  app('webengage', 'WebEngage', 'W', 'marketing', 'Marketing automation and user data'),
  app('ga4', 'Google Analytics 4', 'G', 'marketing', 'Web and app analytics — identifiers'),
  app('mixpanel', 'Mixpanel', 'M', 'marketing', 'Product analytics and user profiles'),
  app('meta-ads', 'Meta Ads Manager', 'M', 'marketing', 'Custom audiences and ad data'),
  app('google-ads', 'Google Ads', 'G', 'marketing', 'Customer match lists and ad data'),

  app('shopify', 'Shopify', 'S', 'ecommerce', 'Orders, customers and addresses'),
  app('woocommerce', 'WooCommerce', 'W', 'ecommerce', 'Orders and customer records'),
  app(
    'amazon-seller',
    'Amazon Seller Central',
    'A',
    'ecommerce',
    'Orders, buyers and shipping data',
  ),
  app('flipkart-seller', 'Flipkart Seller Hub', 'F', 'ecommerce', 'Orders and buyer details'),
  app('shiprocket', 'Shiprocket', 'S', 'ecommerce', 'Shipments — names, phones and addresses'),
  app('delhivery', 'Delhivery', 'D', 'ecommerce', 'Logistics — consignee details'),
  app('unicommerce', 'Unicommerce', 'U', 'ecommerce', 'Order and inventory management'),

  app('digilocker', 'DigiLocker', 'D', 'kyc', 'Issued documents and consented fetches'),
  app('protean', 'Protean (NSDL e-Gov)', 'P', 'kyc', 'PAN and e-KYC records'),
  app('emudhra', 'eMudhra', 'E', 'kyc', 'eSign and DSC issuance records'),
  app('digio', 'Digio', 'D', 'kyc', 'eSign, eMandate and KYC records'),
  app('signzy', 'Signzy', 'S', 'kyc', 'Video KYC and identity verification'),
  app('idfy', 'IDfy', 'I', 'kyc', 'Background checks and ID verification'),
  app('hyperverge', 'HyperVerge', 'H', 'kyc', 'Face match and document OCR'),
  app('karza', 'Karza / Perfios', 'K', 'kyc', 'Identity, bank and GST verification'),

  app('github', 'GitHub', 'G', 'engineering', 'Repositories — emails and secrets in code'),
  app('gitlab', 'GitLab', 'G', 'engineering', 'Repositories, issues and CI variables'),
  app('bitbucket', 'Bitbucket', 'B', 'engineering', 'Repositories and pipelines'),
  app('jira', 'Jira', 'J', 'engineering', 'Issues and attachments on Atlassian Cloud'),
  app('confluence', 'Confluence', 'C', 'engineering', 'Wiki pages and attachments'),
  app('figma', 'Figma', 'F', 'engineering', 'Design files and prototype content'),

  app('google-drive', 'Google Drive', 'G', 'storage', 'Shared drives, docs and sheets'),
  app('onedrive', 'OneDrive / SharePoint', 'O', 'storage', 'Files, libraries and shared links'),
  app('dropbox', 'Dropbox', 'D', 'storage', 'Folders and shared files'),
  app('box', 'Box', 'B', 'storage', 'Content cloud folders'),

  {
    id: 'other-rest',
    name: 'Other app (REST API)',
    category: 'app',
    group: 'other',
    description: 'Any app with a REST API',
    mark: 'O',
    fields: [
      text('appName', 'App name', 'e.g. Tally, Razorpay dashboard', true),
      text('baseUrl', 'API base URL', 'https://api.example.com/v1', true),
      secret('token', 'API key / token', true),
    ],
  },
];

export const CONNECTOR_CATALOGUE: readonly Connector[] = [
  ...DATABASES,
  ...CLOUDS,
  ...FILE_STORES,
  ...APPS,
];
