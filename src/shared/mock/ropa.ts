/**
 * MOCK DATA — see the note in `workspace.ts`. Record of Processing
 * Activities — the register `/ropa` reads and `/ropa/add` writes to.
 */
export type LawfulBasis =
  'consent' | 'voluntary' | 'employment' | 'legal-obligation' | 'parental-consent' | 'security';

export const LAWFUL_BASIS_LABELS: Record<LawfulBasis, string> = {
  consent: 'Consent — s.6',
  voluntary: 'Voluntary provision — s.7(a)',
  employment: 'Employment — s.7(i)',
  'legal-obligation': 'Legal obligation — s.7(d)',
  'parental-consent': 'Verifiable parental consent — s.9',
  security: 'Security safeguards — s.8(5)',
};

export type ActivityStatus = 'approved' | 'needs-review' | 'ai-draft';

export type ActivityHistoryEntry = {
  label: string;
  date: string;
};

export type ProcessingActivity = {
  id: string;
  name: string;
  purpose: string;
  principals: string;
  dataCategories: string[];
  lawfulBasis: LawfulBasis;
  retention: string;
  retentionUnknown?: boolean;
  ownerId: string;
  status: ActivityStatus;
  involvesMinors: boolean;
  dataSource: string;
  operations: string[];
  systems: string[];
  storageLocation: string;
  processors: string[];
  recipients: string[];
  crossBorder: string;
  security: string[];
  evidence: string[];
  confidence?: number;
  issues?: string[];
  reviewer?: string;
  reviewedAt?: string;
  version: number;
  history: ActivityHistoryEntry[];
};

export const ACTIVITIES: ProcessingActivity[] = [
  {
    id: 'ropa-1',
    name: 'Customer support ticketing',
    purpose: 'Resolve customer issues and track support history',
    principals: 'Customers',
    dataCategories: ['Name', 'Email', 'Phone number'],
    lawfulBasis: 'voluntary',
    retention: '3 years after last contact',
    ownerId: 'person-2',
    status: 'approved',
    involvesMinors: false,
    dataSource: 'Directly from the individual',
    operations: ['Collection', 'Storage', 'Use', 'Retrieval'],
    systems: ['Zoho CRM', 'Jira SUPPORT'],
    storageLocation: 'AWS ap-south-1 (Mumbai)',
    processors: [],
    recipients: [],
    crossBorder: 'India only — confirmed by owner',
    security: ['Encryption at rest', 'Access control', 'Audit logging'],
    evidence: ['Zoho CRM · Contacts', 'Jira SUPPORT · 1,120 items', 'support@ mailbox'],
    confidence: 94,
    reviewer: 'Muntasir Mansoor',
    reviewedAt: '14 Jan 2026',
    version: 2,
    history: [
      {
        label: 'Approved by Muntasir Mansoor — sign-off & evidence snapshot logged',
        date: '14 Jan 2026',
      },
      { label: 'Drafted by Jethur AI — 3 evidence sources, 94% confidence', date: '2 Jan 2026' },
    ],
  },
  {
    id: 'ropa-2',
    name: 'Payroll processing',
    purpose: 'Calculate and disburse employee salaries',
    principals: 'Employees',
    dataCategories: ['Name', 'Aadhaar number', 'PAN', 'Financial data'],
    lawfulBasis: 'employment',
    retention: '8 years (statutory)',
    ownerId: 'person-3',
    status: 'approved',
    involvesMinors: false,
    dataSource: 'Employer / customer organisation',
    operations: ['Collection', 'Storage', 'Use'],
    systems: ['M365 HR mailbox', 'SharePoint HR-Docs'],
    storageLocation: 'AWS ap-south-1 (Mumbai)',
    processors: [],
    recipients: ['Tax authorities (statutory filings)'],
    crossBorder: 'India only — confirmed by owner',
    security: ['Encryption at rest', 'Access control', 'Audit logging'],
    evidence: [
      'M365 HR mailbox · salary data',
      'SharePoint HR-Docs · offer letters',
      'endpoint payroll.xlsx',
    ],
    reviewer: 'Faisal Babu M',
    reviewedAt: '9 Jan 2026',
    version: 1,
    history: [
      {
        label: 'Approved by Faisal Babu M — sign-off & evidence snapshot logged',
        date: '9 Jan 2026',
      },
    ],
  },
  {
    id: 'ropa-3',
    name: 'Sales pipeline management',
    purpose: 'Track prospects through the sales funnel',
    principals: 'Consumers',
    dataCategories: ['Name', 'Email', 'Phone number'],
    lawfulBasis: 'consent',
    retention: '2 years from last activity',
    ownerId: 'person-4',
    status: 'needs-review',
    involvesMinors: false,
    dataSource: 'Directly from the individual',
    operations: ['Collection', 'Storage', 'Use', 'Sharing'],
    systems: ['Zoho Leads module'],
    storageLocation: 'AWS ap-south-1 (Mumbai)',
    processors: ['Email/marketing tool'],
    recipients: [],
    crossBorder: 'NEEDS CONFIRMATION — primary storage in India; other locations unverified',
    security: ['Encryption at rest', 'Access control', 'Audit logging'],
    evidence: ['Zoho Leads module', 'M365 campaign folder', 'export_list.csv'],
    confidence: 81,
    issues: ['Processor location'],
    version: 1,
    history: [
      { label: 'Drafted by Jethur AI — 3 evidence sources, 81% confidence', date: '28 Dec 2025' },
    ],
  },
  {
    id: 'ropa-4',
    name: 'Payment processing',
    purpose: 'Process customer payments and refunds',
    principals: 'Customers',
    dataCategories: ['Name', 'Financial data'],
    lawfulBasis: 'voluntary',
    retention: '7 years (statutory)',
    ownerId: 'person-5',
    status: 'approved',
    involvesMinors: false,
    dataSource: 'Another internal process',
    operations: ['Collection', 'Storage', 'Use', 'Sharing'],
    systems: ['RDS mysql-prod', 'MySQL billing-db'],
    storageLocation: 'AWS ap-south-1 (Mumbai) · processor systems',
    processors: ['Razorpay'],
    recipients: ['Tax authorities (GST filings)'],
    crossBorder: 'India + other countries — s.16 negative-list check',
    security: ['Encryption at rest', 'Access control', 'Audit logging'],
    evidence: [
      'RDS mysql-prod · customers',
      'MySQL billing-db · invoices',
      'Razorpay payment flows',
    ],
    reviewer: 'Ranjith M R',
    reviewedAt: '20 Dec 2025',
    version: 3,
    history: [
      {
        label: 'Approved by Ranjith M R — sign-off & evidence snapshot logged',
        date: '20 Dec 2025',
      },
    ],
  },
  {
    id: 'ropa-5',
    name: 'Candidate recruitment',
    purpose: 'Evaluate and shortlist job applicants',
    principals: 'Candidates',
    dataCategories: ['Name', 'Email', 'Phone number', 'Resume data'],
    lawfulBasis: 'consent',
    retention: 'Unknown',
    retentionUnknown: true,
    ownerId: 'person-3',
    status: 'ai-draft',
    involvesMinors: false,
    dataSource: 'Directly from the individual',
    operations: ['Collection', 'Storage', 'Use'],
    systems: ['careers@ mailbox'],
    storageLocation: 'AWS ap-south-1 (Mumbai)',
    processors: [],
    recipients: [],
    crossBorder: 'NEEDS CONFIRMATION — primary storage in India; other locations unverified',
    security: ['Encryption at rest', 'Access control', 'Audit logging'],
    evidence: ['careers@ mailbox', 'CV attachments · M365', 'offer tracker sheet'],
    confidence: 72,
    version: 1,
    history: [
      { label: 'Drafted by Jethur AI — 3 evidence sources, 72% confidence', date: 'Just now' },
    ],
  },
  {
    id: 'ropa-6',
    name: 'Support device inventory',
    purpose: 'Track company devices issued to employees',
    principals: 'Employees',
    dataCategories: ['Name', 'Device ID'],
    lawfulBasis: 'employment',
    retention: 'Duration of employment + 1 year',
    ownerId: 'person-1',
    status: 'ai-draft',
    involvesMinors: false,
    dataSource: 'Generated internally',
    operations: ['Storage', 'Use', 'Erasure'],
    systems: ['MDM inventory system'],
    storageLocation: 'AWS ap-south-1 (Mumbai)',
    processors: [],
    recipients: [],
    crossBorder: 'India only — confirmed by owner',
    security: ['Encryption at rest', 'Access control', 'Audit logging'],
    evidence: ['MDM inventory export · 240 devices'],
    confidence: 84,
    version: 1,
    history: [
      { label: 'Drafted by Jethur AI — 1 evidence source, 84% confidence', date: 'Just now' },
    ],
  },
];

export function getActivity(id: string): ProcessingActivity | undefined {
  return ACTIVITIES.find((activity) => activity.id === id);
}
