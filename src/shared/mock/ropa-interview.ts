/**
 * MOCK DATA — see the note in `workspace.ts`. Interview catalogue and
 * activity-generation logic behind `/ropa/generate` (the "Generate your RoPA
 * with Jethur AI" 4-step interview). Mirrors the prototype's `rpmDefaults()` /
 * `RPM_META` / `rpmActivities()` — option labels, hints and evidence lines are
 * mock content (like `ACTIVITIES` names/purposes), not localized UI copy.
 */
import { DATASETS } from './data-map';
import { PEOPLE } from './people';
import type { LawfulBasis } from './ropa';

export type InterviewGroup = 'principals' | 'purposes' | 'colsrc' | 'processors' | 'recipients';

export type InterviewOptionMeta = {
  hint?: string;
  evidence?: string;
  confidence?: 'hi' | 'md';
  /** Always required, cannot be unchecked (e.g. AWS hosting, Security & backups). */
  isLocked?: boolean;
  /** Flagged as a sensitive/high-stakes choice (e.g. Minors). */
  isSensitive?: boolean;
};

export const INTERVIEW_OPTIONS: Record<InterviewGroup, Record<string, InterviewOptionMeta>> = {
  principals: {
    'B2B customers': {
      hint: 'Buyers & their staff',
      evidence: 'Zoho CRM · 1.1L contacts',
      confidence: 'hi',
    },
    'Consumers (B2C)': { hint: 'Individual end-customers' },
    Employees: {
      hint: 'Payroll, HR records',
      evidence: 'M365 HR mailbox · salary data',
      confidence: 'hi',
    },
    'Job candidates': { hint: 'CVs & screening', evidence: 'careers@ mailbox', confidence: 'md' },
    'Vendors & partners': {
      hint: 'Contacts, GSTIN, bank a/c',
      evidence: 'MySQL · vendor GSTINs',
      confidence: 'hi',
    },
    'Minors (under 18)': {
      hint: 'Triggers s.9 — parental consent, no tracking/ads',
      isSensitive: true,
    },
  },
  purposes: {
    'KYC & onboarding': {
      evidence: 'Aadhaar/PAN scans in s3://customer-uploads',
      confidence: 'hi',
    },
    'Billing & GST invoicing': { evidence: 'GSTIN + bank a/c in billing tables', confidence: 'hi' },
    'Customer service': { evidence: 'Zoho CRM + Jira SUPPORT findings', confidence: 'hi' },
    'Marketing & leads': { evidence: 'Zoho Leads module', confidence: 'md' },
    'Product analytics & debugging': {
      evidence: 'Device IDs · MongoDB sessions',
      confidence: 'md',
    },
    'Security & backups': {
      evidence: 'DB dumps in s3://db-backups',
      confidence: 'hi',
      isLocked: true,
      hint: 'Always required — s.8(5)',
    },
  },
  colsrc: {
    'Directly from the individual': { evidence: 'Signup + KYC upload flows', confidence: 'hi' },
    'Employer / customer organisation': {
      evidence: 'B2B contacts added by client admins',
      confidence: 'md',
    },
    'Third-party provider': {},
    'Public source': {},
    'Another internal process': { evidence: 'Billing → invoices pipeline', confidence: 'md' },
    'Generated internally': { evidence: 'Logs, device IDs, backups', confidence: 'hi' },
  },
  processors: {
    Razorpay: {
      hint: 'Payments — card/UPI collection',
      evidence: 'Payment flows in billing',
      confidence: 'md',
    },
    'AWS · ap-south-1': {
      hint: 'Hosting & infrastructure',
      evidence: 'Connected AWS account · 10 sources discovered',
      confidence: 'hi',
      isLocked: true,
    },
    'WhatsApp BSP': { hint: 'OTP & notifications' },
    'Email/marketing tool': {
      hint: 'Campaign delivery',
      evidence: 'Marketing lists exported',
      confidence: 'md',
    },
  },
  recipients: {
    'Tax authorities (GST filings)': {
      hint: 'Statutory recipient — not a processor',
      evidence: 'GSTIN fields in invoices',
      confidence: 'hi',
    },
    'External auditor': { hint: 'Periodic audits' },
    "Customers' banks (payouts)": { hint: 'Refunds & settlements' },
  },
};

const INTERVIEW_DEFAULTS: Record<InterviewGroup, Record<string, boolean>> = {
  principals: {
    'B2B customers': true,
    'Consumers (B2C)': false,
    Employees: true,
    'Job candidates': true,
    'Vendors & partners': true,
    'Minors (under 18)': false,
  },
  purposes: {
    'KYC & onboarding': true,
    'Billing & GST invoicing': true,
    'Customer service': true,
    'Marketing & leads': true,
    'Product analytics & debugging': true,
    'Security & backups': true,
  },
  colsrc: {
    'Directly from the individual': true,
    'Employer / customer organisation': true,
    'Third-party provider': false,
    'Public source': false,
    'Another internal process': true,
    'Generated internally': true,
  },
  processors: {
    Razorpay: true,
    'AWS · ap-south-1': true,
    'WhatsApp BSP': false,
    'Email/marketing tool': true,
  },
  recipients: {
    'Tax authorities (GST filings)': true,
    'External auditor': false,
    "Customers' banks (payouts)": false,
  },
};

export type CrossBorderChoice = 'india' | 'multi' | 'other' | 'unknown';
export type RetentionMethod = 'law' | 'policy' | 'business' | 'purpose' | 'unknown';

export type InterviewAnswers = {
  principals: Record<string, boolean>;
  purposes: Record<string, boolean>;
  colsrc: Record<string, boolean>;
  processors: Record<string, boolean>;
  recipients: Record<string, boolean>;
  crossBorder: CrossBorderChoice | null;
  retentionMethod: RetentionMethod;
  ownerOverrides: Record<string, string>;
};

export function defaultInterviewAnswers(): InterviewAnswers {
  return {
    principals: { ...INTERVIEW_DEFAULTS.principals },
    purposes: { ...INTERVIEW_DEFAULTS.purposes },
    colsrc: { ...INTERVIEW_DEFAULTS.colsrc },
    processors: { ...INTERVIEW_DEFAULTS.processors },
    recipients: { ...INTERVIEW_DEFAULTS.recipients },
    crossBorder: null,
    retentionMethod: 'law',
    ownerOverrides: {},
  };
}

export function selectedKeys(group: Record<string, boolean>): string[] {
  return Object.keys(group).filter((key) => group[key]);
}

export function evidenceSummary(): { datasetCount: number; sourceCount: number } {
  return {
    datasetCount: DATASETS.length,
    sourceCount: new Set(DATASETS.map((d) => d.sourceId)).size,
  };
}

const CROSS_BORDER_NOTE: Record<CrossBorderChoice, string> = {
  india: 'India only — confirmed by owner',
  multi: 'India + other countries — s.16 negative-list check',
  other: 'Outside India — s.16 check',
  unknown: 'NEEDS CONFIRMATION — primary storage in India; other locations unverified',
};

function findOwnerByDepartment(department: string): string {
  return PEOPLE.find((p) => p.department === department)?.id ?? PEOPLE[1]?.id ?? 'person-1';
}

export type GeneratedActivity = {
  name: string;
  purpose: string;
  principals: string;
  dataCategories: string[];
  lawfulBasis: LawfulBasis;
  retention: string;
  retentionUnknown: boolean;
  dataSource: string;
  operations: string[];
  processors: string[];
  recipients: string[];
  crossBorder: string;
  evidence: string[];
  confidence: number;
  issues: string[];
  suggestedOwnerId: string;
  suggestedOwnerReason: string;
};

function retentionFor(
  method: RetentionMethod,
  lawRule: { period: string; source: string } | null,
): { retention: string; retentionUnknown: boolean; issue: string | null } {
  if (lawRule && method === 'law') {
    return { retention: lawRule.period, retentionUnknown: false, issue: null };
  }
  if (method === 'policy') {
    return { retention: 'Per company policy', retentionUnknown: false, issue: null };
  }
  if (method === 'business') {
    return { retention: 'Per business requirement', retentionUnknown: false, issue: null };
  }
  if (method === 'purpose') {
    return { retention: 'Until the purpose is fulfilled', retentionUnknown: false, issue: null };
  }
  return { retention: 'Unknown', retentionUnknown: true, issue: 'Retention' };
}

type ActivityBase = Omit<
  GeneratedActivity,
  'retention' | 'retentionUnknown' | 'crossBorder' | 'issues'
>;

type ActivityTemplate = {
  isIncluded: (answers: InterviewAnswers) => boolean;
  lawRule: { period: string; source: string } | null;
  extraIssues?: (answers: InterviewAnswers) => string[];
  base: (answers: InterviewAnswers) => ActivityBase;
};

const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    isIncluded: (a) => a.purposes['KYC & onboarding'] === true,
    lawRule: { period: 'Per KYC/PMLA rule', source: 'Configured KYC retention rule' },
    base: () => ({
      name: 'Customer KYC & onboarding',
      purpose: 'Verify customer identity before service activation',
      principals: 'Customers',
      dataCategories: ['Aadhaar number', 'PAN', 'Name', 'Address'],
      lawfulBasis: 'consent',
      dataSource: 'Directly from the individual',
      operations: ['Collection', 'Storage', 'Use'],
      processors: [],
      recipients: [],
      evidence: [
        's3://customer-uploads · kyc/ prefix',
        'Zoho CRM · Contacts',
        'OCR Aadhaar findings · 540 objects',
      ],
      confidence: 96,
      suggestedOwnerId: findOwnerByDepartment('Sales'),
      suggestedOwnerReason: 'owns billing-db & KYC store',
    }),
  },
  {
    isIncluded: (a) => a.purposes['Billing & GST invoicing'] === true,
    lawRule: { period: '8 years', source: 'Configured GST/accounting retention rule' },
    base: (a) => ({
      name: 'Billing, invoicing & GST',
      purpose: 'Collect payments and issue GST-compliant invoices',
      principals: 'Customers',
      dataCategories: ['Name', 'GSTIN', 'Bank a/c'],
      lawfulBasis: 'legal-obligation',
      dataSource: 'Another internal process',
      operations: ['Collection', 'Storage', 'Use', 'Sharing'],
      processors: a.processors.Razorpay ? ['Razorpay'] : [],
      recipients: a.recipients['Tax authorities (GST filings)']
        ? ['Tax authorities (GST filings)']
        : [],
      evidence: [
        'RDS mysql-prod · customers',
        'MySQL billing-db · invoices',
        'GSTIN fields · 8,240 records',
      ],
      confidence: 93,
      suggestedOwnerId: findOwnerByDepartment('Finance'),
      suggestedOwnerReason: 'owner of invoices · GST filings',
    }),
  },
  {
    isIncluded: (a) => a.purposes['Customer service'] === true,
    lawRule: null,
    base: () => ({
      name: 'Customer service & support',
      purpose: 'Resolve customer queries and complaints',
      principals: 'Customers',
      dataCategories: ['Name', 'Email', 'Phone number'],
      lawfulBasis: 'voluntary',
      dataSource: 'Directly from the individual',
      operations: ['Collection', 'Storage', 'Use', 'Retrieval'],
      processors: [],
      recipients: [],
      evidence: ['Zoho CRM', 'Jira SUPPORT · 1,120 items', 'support@ mailbox'],
      confidence: 94,
      suggestedOwnerId: findOwnerByDepartment('Support'),
      suggestedOwnerReason: 'owns Jira SUPPORT queue',
    }),
  },
  {
    isIncluded: (a) => a.purposes['Marketing & leads'] === true,
    lawRule: { period: 'Until withdrawal', source: 'Consent-based — s.6(4)' },
    base: (a) => ({
      name: 'Marketing & lead generation',
      purpose: 'Reach prospects who opted in to product updates',
      principals: 'Prospects',
      dataCategories: ['Email', 'Phone number'],
      lawfulBasis: 'consent',
      dataSource: 'Directly from the individual',
      operations: ['Collection', 'Storage', 'Use', 'Sharing'],
      processors: a.processors['Email/marketing tool'] ? ['Email/marketing tool'] : [],
      recipients: [],
      evidence: ['Zoho Leads module', 'M365 campaign folder', 'export_list.csv'],
      confidence: 81,
      suggestedOwnerId: findOwnerByDepartment('Marketing'),
      suggestedOwnerReason: 'owns Zoho Leads',
    }),
  },
  {
    isIncluded: (a) => a.principals.Employees === true,
    lawRule: { period: 'Employment + 3 years', source: 'Configured employment-records rule' },
    base: () => ({
      name: 'HR & employee management',
      purpose: 'Run payroll, statutory filings and employee services',
      principals: 'Employees',
      dataCategories: ['Salary', 'ID proofs', 'Bank a/c'],
      lawfulBasis: 'employment',
      dataSource: 'Employer / customer organisation',
      operations: ['Collection', 'Storage', 'Use'],
      processors: [],
      recipients: [],
      evidence: [
        'M365 HR mailbox · salary data',
        'SharePoint HR-Docs · offer letters',
        'endpoint payroll.xlsx',
      ],
      confidence: 90,
      suggestedOwnerId: findOwnerByDepartment('HR'),
      suggestedOwnerReason: 'owns HR mailbox & payroll',
    }),
  },
  {
    isIncluded: (a) => a.principals['Job candidates'] === true,
    lawRule: null,
    base: () => ({
      name: 'Recruitment & screening',
      purpose: 'Assess applications for open roles',
      principals: 'Candidates',
      dataCategories: ['Name', 'Email', 'CV data'],
      lawfulBasis: 'consent',
      dataSource: 'Directly from the individual',
      operations: ['Collection', 'Storage', 'Use'],
      processors: [],
      recipients: [],
      evidence: ['careers@ mailbox', 'CV attachments · M365', 'offer tracker sheet'],
      confidence: 72,
      suggestedOwnerId: findOwnerByDepartment('HR'),
      suggestedOwnerReason: 'owns careers@ mailbox',
    }),
  },
  {
    isIncluded: (a) => a.principals['Vendors & partners'] === true,
    lawRule: { period: '8 years', source: 'Configured GST/accounting retention rule' },
    base: (a) => ({
      name: 'Vendor & finance management',
      purpose: 'Pay vendors and meet tax obligations',
      principals: 'Vendor contacts',
      dataCategories: ['Name', 'GSTIN', 'Bank a/c'],
      lawfulBasis: 'legal-obligation',
      dataSource: 'Third-party provider',
      operations: ['Collection', 'Storage', 'Use'],
      processors: [],
      recipients: a.recipients['Tax authorities (GST filings)']
        ? ['Tax authorities (GST filings)']
        : [],
      evidence: ['MySQL billing-db · vendor_gstins', 'Zoho Accounts module'],
      confidence: 88,
      suggestedOwnerId: findOwnerByDepartment('Finance'),
      suggestedOwnerReason: 'owns vendor master',
    }),
  },
  {
    isIncluded: (a) => a.purposes['Product analytics & debugging'] === true,
    lawRule: { period: '90 days rolling', source: 'Configured log-retention rule' },
    base: (a) => ({
      name: 'Product engineering & debugging',
      purpose: 'Diagnose issues and improve the product',
      principals: 'Users (pseudonymised)',
      dataCategories: ['Email', 'Device IDs', 'IP address'],
      lawfulBasis: 'consent',
      dataSource: 'Generated internally',
      operations: ['Storage', 'Use', 'Erasure'],
      processors: a.processors['AWS · ap-south-1'] ? ['AWS · ap-south-1'] : [],
      recipients: [],
      evidence: ['MongoDB sessions · device IDs', 'RDS replica', 'GitHub fixtures · seeded users'],
      confidence: 84,
      suggestedOwnerId: findOwnerByDepartment('Engineering'),
      suggestedOwnerReason: 'owns repos & replicas',
    }),
  },
  {
    isIncluded: (a) => a.purposes['Security & backups'] === true,
    lawRule: { period: '35 days rolling', source: 'Configured backup-retention rule' },
    base: (a) => ({
      name: 'Security operations & backups',
      purpose: 'Prevent, detect and recover from security incidents',
      principals: 'All principals',
      dataCategories: ['Full DB dumps', 'Access logs'],
      lawfulBasis: 'security',
      dataSource: 'Generated internally',
      operations: ['Storage', 'Retrieval', 'Erasure'],
      processors: a.processors['AWS · ap-south-1'] ? ['AWS · ap-south-1'] : [],
      recipients: [],
      evidence: ['s3://db-backups · 12 archives', 's3://app-logs · 240K objects'],
      confidence: 91,
      suggestedOwnerId: findOwnerByDepartment('Engineering'),
      suggestedOwnerReason: 'owns backups & logs',
    }),
  },
  {
    isIncluded: (a) => a.principals['Minors (under 18)'] === true,
    lawRule: { period: 'Till majority + purpose', source: 's.9 — confirmed by you' },
    extraIssues: () => ['Guardian consent flow'],
    base: () => ({
      name: "Children's data handling",
      purpose: 'Serve under-18 users with guardian oversight — no tracking or targeted ads (s.9)',
      principals: 'Minors + guardians',
      dataCategories: ['Child data', 'Guardian contact'],
      lawfulBasis: 'parental-consent',
      dataSource: 'Directly from the individual',
      operations: ['Collection', 'Storage', 'Use'],
      processors: [],
      recipients: [],
      evidence: ['Sign-up age flags · product DB'],
      confidence: 75,
      suggestedOwnerId: findOwnerByDepartment('HR'),
      suggestedOwnerReason: 'people-data owner · s.9',
    }),
  },
];

/** Mirrors the prototype's rpmActivities(): purposes/principals → activity templates. */
export function generateActivities(answers: InterviewAnswers): GeneratedActivity[] {
  const crossBorder = answers.crossBorder
    ? CROSS_BORDER_NOTE[answers.crossBorder]
    : CROSS_BORDER_NOTE.unknown;
  const crossBorderIssue =
    !answers.crossBorder || answers.crossBorder === 'unknown' ? 'Cross-border' : null;

  return ACTIVITY_TEMPLATES.filter((template) => template.isIncluded(answers)).map((template) => {
    const retention = retentionFor(answers.retentionMethod, template.lawRule);
    const issues = [
      ...(template.extraIssues?.(answers) ?? []),
      ...(retention.issue ? [retention.issue] : []),
      ...(crossBorderIssue ? [crossBorderIssue] : []),
    ];
    return {
      ...template.base(answers),
      retention: retention.retention,
      retentionUnknown: retention.retentionUnknown,
      crossBorder,
      issues,
    };
  });
}

export type ActivityQualityTone = 'success' | 'warning' | 'danger';

/** Mirrors the prototype's per-activity dot colour: g/y/r in rpmRender's step-4 table. */
export function activityQualityTone(activity: GeneratedActivity): ActivityQualityTone {
  if (activity.retentionUnknown) return 'danger';
  if (activity.confidence >= 90 && activity.issues.length === 0) return 'success';
  return 'warning';
}

export function activityQuality(activities: GeneratedActivity[]): {
  high: number;
  needsReview: number;
  missing: number;
} {
  let high = 0;
  let needsReview = 0;
  let missing = 0;
  for (const activity of activities) {
    const tone = activityQualityTone(activity);
    if (tone === 'danger') missing += 1;
    else if (tone === 'success') high += 1;
    else needsReview += 1;
  }
  return { high, needsReview, missing };
}
