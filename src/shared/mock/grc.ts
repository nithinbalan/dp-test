/**
 * MOCK DATA — see the note in `workspace.ts`. The Risk Register and Action
 * Plans — two views over the same underlying findings, derived from Gap
 * Assessment, Controls and DPIA (`dpia.ts`) rather than entered by hand.
 * `/risks` and `/actions` both read this file.
 */

/* ---------- Risk Register ---------- */

export type RiskSourceType = 'control' | 'gap-assessment' | 'dpia';
export type RiskStatus = 'open' | 'mitigating' | 'closed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type Risk = {
  id: string;
  title: string;
  domain: string;
  sourceType: RiskSourceType;
  sourceRef: string;
  level: RiskLevel;
  likelihood: number;
  impact: number;
  status: RiskStatus;
  ownerId: string;
  identifiedAt: string;
};

export const RISKS: Risk[] = [
  {
    id: 'RISK-1',
    title: 'Access to systems holding personal data is not logged and reviewed',
    domain: 'Security',
    sourceType: 'control',
    sourceRef: 'G2',
    level: 'high',
    likelihood: 4,
    impact: 4,
    status: 'open',
    ownerId: 'person-1',
    identifiedAt: '2026-08-30T04:10:00Z',
  },
  {
    id: 'RISK-2',
    title: 'Collection observed in scans exceeds what activities declare',
    domain: 'Lawful basis',
    sourceType: 'control',
    sourceRef: 'A2',
    level: 'medium',
    likelihood: 3,
    impact: 3,
    status: 'mitigating',
    ownerId: 'person-2',
    identifiedAt: '2026-08-30T04:00:00Z',
  },
  {
    id: 'RISK-3',
    title: 'Processing activities are missing a sourced retention rule',
    domain: 'Retention',
    sourceType: 'control',
    sourceRef: 'F1',
    level: 'high',
    likelihood: 4,
    impact: 3,
    status: 'open',
    ownerId: 'person-3',
    identifiedAt: '2026-08-30T04:05:00Z',
  },
  {
    id: 'RISK-4',
    title: 'Erasure is not running on schedule with the required 48-hour notice',
    domain: 'Retention',
    sourceType: 'control',
    sourceRef: 'F2',
    level: 'critical',
    likelihood: 4,
    impact: 5,
    status: 'open',
    ownerId: 'person-3',
    identifiedAt: '2026-08-30T00:00:00Z',
  },
  {
    id: 'RISK-5',
    title: 'Cross-border data flows are not inventoried or screened',
    domain: 'Transfers',
    sourceType: 'gap-assessment',
    sourceRef: 'q11',
    level: 'critical',
    likelihood: 3,
    impact: 5,
    status: 'open',
    ownerId: 'person-1',
    identifiedAt: '2026-08-25T09:00:00Z',
  },
  {
    id: 'RISK-6',
    title: 'Payroll processing carries unmitigated exposure on Aadhaar and PAN',
    domain: 'Governance',
    sourceType: 'dpia',
    sourceRef: 'dpia-1',
    level: 'high',
    likelihood: 3,
    impact: 4,
    status: 'mitigating',
    ownerId: 'person-3',
    identifiedAt: '2026-08-22T00:00:00Z',
  },
  {
    id: 'RISK-7',
    title: 'Payment processing DPIA has an open financial-data exposure finding',
    domain: 'Governance',
    sourceType: 'dpia',
    sourceRef: 'dpia-2',
    level: 'medium',
    likelihood: 3,
    impact: 3,
    status: 'open',
    ownerId: 'person-5',
    identifiedAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'RISK-8',
    title: 'Grievance process has no published response-period SLA',
    domain: 'Rights & grievance',
    sourceType: 'gap-assessment',
    sourceRef: 'q4',
    level: 'medium',
    likelihood: 2,
    impact: 3,
    status: 'open',
    ownerId: 'person-2',
    identifiedAt: '2026-08-25T09:00:00Z',
  },
  {
    id: 'RISK-9',
    title: 'Notices are missing regional-language versions',
    domain: 'Notice',
    sourceType: 'gap-assessment',
    sourceRef: 'q2',
    level: 'low',
    likelihood: 2,
    impact: 2,
    status: 'closed',
    ownerId: 'person-2',
    identifiedAt: '2026-08-10T00:00:00Z',
  },
];

export function getRisk(id: string): Risk | undefined {
  return RISKS.find((risk) => risk.id === id);
}

/* ---------- Action Plans ---------- */

export type ActionStatus = 'todo' | 'in-progress' | 'done';
export type ActionPriority = 'high' | 'medium' | 'low';
export type ActionSourceType = 'risk' | 'dpia';

export type ActionItem = {
  id: string;
  title: string;
  sourceType: ActionSourceType;
  sourceRef: string;
  ownerId: string;
  dueDate: string;
  priority: ActionPriority;
  status: ActionStatus;
};

export const ACTION_ITEMS: ActionItem[] = [
  {
    id: 'ACT-1',
    title: 'Enable access logging and set up a quarterly access review',
    sourceType: 'risk',
    sourceRef: 'RISK-1',
    ownerId: 'person-1',
    dueDate: '2026-09-15T00:00:00Z',
    priority: 'high',
    status: 'todo',
  },
  {
    id: 'ACT-2',
    title: 'Reconcile scan findings against declared data categories for RA-003',
    sourceType: 'risk',
    sourceRef: 'RISK-2',
    ownerId: 'person-2',
    dueDate: '2026-09-10T00:00:00Z',
    priority: 'medium',
    status: 'in-progress',
  },
  {
    id: 'ACT-3',
    title: 'Assign a sourced retention rule to every activity missing one',
    sourceType: 'risk',
    sourceRef: 'RISK-3',
    ownerId: 'person-3',
    dueDate: '2026-09-12T00:00:00Z',
    priority: 'high',
    status: 'todo',
  },
  {
    id: 'ACT-4',
    title: 'Automate the 48-hour erasure notice and re-run the erasure cycle',
    sourceType: 'risk',
    sourceRef: 'RISK-4',
    ownerId: 'person-3',
    dueDate: '2026-09-08T00:00:00Z',
    priority: 'high',
    status: 'in-progress',
  },
  {
    id: 'ACT-5',
    title: 'Build the cross-border transfer register and screen against the restricted list',
    sourceType: 'risk',
    sourceRef: 'RISK-5',
    ownerId: 'person-1',
    dueDate: '2026-09-20T00:00:00Z',
    priority: 'high',
    status: 'todo',
  },
  {
    id: 'ACT-6',
    title: 'Complete remediation for the Payroll DPIA high-risk findings',
    sourceType: 'dpia',
    sourceRef: 'dpia-1',
    ownerId: 'person-3',
    dueDate: '2026-09-05T00:00:00Z',
    priority: 'high',
    status: 'in-progress',
  },
  {
    id: 'ACT-7',
    title: 'Finish the Payment Processing DPIA and assign treatments',
    sourceType: 'dpia',
    sourceRef: 'dpia-2',
    ownerId: 'person-5',
    dueDate: '2026-09-18T00:00:00Z',
    priority: 'medium',
    status: 'todo',
  },
  {
    id: 'ACT-8',
    title: 'Publish a grievance response-period SLA on the request page',
    sourceType: 'risk',
    sourceRef: 'RISK-8',
    ownerId: 'person-2',
    dueDate: '2026-09-09T00:00:00Z',
    priority: 'medium',
    status: 'todo',
  },
  {
    id: 'ACT-9',
    title: 'Start the DPIA screening for Candidate recruitment',
    sourceType: 'dpia',
    sourceRef: 'dpia-3',
    ownerId: 'person-3',
    dueDate: '2026-09-25T00:00:00Z',
    priority: 'low',
    status: 'todo',
  },
  {
    id: 'ACT-10',
    title: 'Publish Hindi and Malayalam notice translations',
    sourceType: 'risk',
    sourceRef: 'RISK-9',
    ownerId: 'person-2',
    dueDate: '2026-08-20T00:00:00Z',
    priority: 'low',
    status: 'done',
  },
];

export function getActionItem(id: string): ActionItem | undefined {
  return ACTION_ITEMS.find((action) => action.id === id);
}
