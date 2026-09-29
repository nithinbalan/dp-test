/**
 * MOCK DATA — see the note in `workspace.ts`. The continuous control
 * monitoring (CCM) library — one control per obligation, checked
 * automatically against evidence from the other modules. `/controls` reads
 * this register.
 */

export type ControlDomainKey =
  | 'lawful-basis'
  | 'notice'
  | 'consent'
  | 'children'
  | 'rights'
  | 'retention'
  | 'security'
  | 'breach'
  | 'processors'
  | 'transfers'
  | 'governance';

export const CONTROL_DOMAIN_ORDER: ControlDomainKey[] = [
  'lawful-basis',
  'notice',
  'consent',
  'children',
  'rights',
  'retention',
  'security',
  'breach',
  'processors',
  'transfers',
  'governance',
];

export type ControlStatus = 'pass' | 'fail' | 'pending';
export type ControlType = 'preventive' | 'detective' | 'corrective';
export type AutomationLevel = 'auto' | 'semi' | 'manual';

export type Control = {
  id: string;
  domain: ControlDomainKey;
  title: string;
  statement: string;
  actRef: string;
  type: ControlType;
  status: ControlStatus;
  automation: AutomationLevel;
  lastCheckedAt: string;
  evidenceCount: number;
};

export const CONTROLS: Control[] = [
  {
    id: 'A1',
    domain: 'lawful-basis',
    title: 'Every processing activity has an approved lawful basis',
    statement:
      'No personal data is processed outside an approved RoPA activity, and every activity names a lawful basis confirmed by a human owner.',
    actRef: 's.4 · s.6 · s.7',
    type: 'preventive',
    status: 'pass',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T04:05:00Z',
    evidenceCount: 3,
  },
  {
    id: 'A2',
    domain: 'lawful-basis',
    title: 'Collection is limited to what is necessary',
    statement:
      'Identifier types scans actually observe match the categories declared on the activity. Anything extra is removed, or the RoPA is corrected.',
    actRef: 's.6(1)',
    type: 'detective',
    status: 'fail',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T04:00:00Z',
    evidenceCount: 3,
  },
  {
    id: 'B1',
    domain: 'notice',
    title: 'Notice is given before or with every consent request',
    statement:
      'Every consent record is paired with the exact notice version served to that person.',
    actRef: 's.5(1) · s.5(2)',
    type: 'preventive',
    status: 'pass',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T10:03:00Z',
    evidenceCount: 3,
  },
  {
    id: 'B2',
    domain: 'notice',
    title: 'Notice content is complete and understandable on its own',
    statement:
      'Every published notice carries the personal data, purpose, withdrawal route, rights route and contact details Rule 3 requires.',
    actRef: 'Rule 3',
    type: 'preventive',
    status: 'pending',
    automation: 'semi',
    lastCheckedAt: '2026-08-27T00:00:00Z',
    evidenceCount: 3,
  },
  {
    id: 'C1',
    domain: 'consent',
    title: 'Consent is free, specific, informed and unambiguous',
    statement:
      'Consent is captured by a clear affirmative action, per purpose, with nothing pre-ticked or bundled.',
    actRef: 's.6(1)–(2)',
    type: 'preventive',
    status: 'pass',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T10:04:00Z',
    evidenceCount: 3,
  },
  {
    id: 'C2',
    domain: 'consent',
    title: 'Withdrawal is as easy as giving',
    statement:
      'For every channel where consent can be given, a withdrawal route exists with comparable effort.',
    actRef: 's.6(4)',
    type: 'detective',
    status: 'pass',
    automation: 'semi',
    lastCheckedAt: '2026-09-01T00:00:00Z',
    evidenceCount: 3,
  },
  {
    id: 'D1',
    domain: 'children',
    title: 'Age assurance happens before processing',
    statement:
      'Every collection point that can reach an under-18 captures age and blocks processing until verified.',
    actRef: 's.9(1)',
    type: 'preventive',
    status: 'pending',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T04:00:00Z',
    evidenceCount: 3,
  },
  {
    id: 'E1',
    domain: 'rights',
    title: 'Rights and grievance channels are published and reachable',
    statement:
      'The means to make a rights request and raise a grievance are published, with identifiers accepted and response period stated.',
    actRef: 'Rule 14(1) · s.13(1)',
    type: 'detective',
    status: 'pass',
    automation: 'auto',
    lastCheckedAt: '2026-09-01T00:00:00Z',
    evidenceCount: 3,
  },
  {
    id: 'E2',
    domain: 'rights',
    title: 'Access requests are answered completely',
    statement:
      'Every access response carries what is processed and why, and which fiduciaries and processors received it.',
    actRef: 's.11(a)–(b)',
    type: 'corrective',
    status: 'pass',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T11:20:00Z',
    evidenceCount: 3,
  },
  {
    id: 'F1',
    domain: 'retention',
    title: 'Every activity carries a retention rule with a source',
    statement:
      'Retention is stated per activity and traced to a statute, policy clause or recorded justification.',
    actRef: 's.8(7)–(8) · Rule 8',
    type: 'preventive',
    status: 'fail',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T04:05:00Z',
    evidenceCount: 3,
  },
  {
    id: 'F2',
    domain: 'retention',
    title: 'Erasure runs on time — with 48-hour notice and a full cascade',
    statement:
      'The data principal is told 48 hours in advance, then data is erased across systems and processors.',
    actRef: 'Rule 8 · s.8(7)',
    type: 'corrective',
    status: 'fail',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T00:00:00Z',
    evidenceCount: 3,
  },
  {
    id: 'G1',
    domain: 'security',
    title: 'Encryption, obfuscation, masking or tokenisation',
    statement:
      'Personal data is unreadable to anyone who reaches it without authorisation — at rest and in transit.',
    actRef: 'Rule 6(1)(a) · s.8(5)',
    type: 'preventive',
    status: 'pass',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T04:00:00Z',
    evidenceCount: 3,
  },
  {
    id: 'G2',
    domain: 'security',
    title: 'Access control, least privilege and joiner–mover–leaver',
    statement:
      'Only the people who need a dataset can reach it, access is reviewed, and leavers lose access within SLA.',
    actRef: 'Rule 6(1)(b)',
    type: 'preventive',
    status: 'fail',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T04:10:00Z',
    evidenceCount: 3,
  },
  {
    id: 'H1',
    domain: 'breach',
    title: 'Breach detection, triage and the register',
    statement:
      'Every suspected incident is recorded with its detection time and triaged against the definition.',
    actRef: 's.8(6) · Rule 7',
    type: 'detective',
    status: 'pass',
    automation: 'auto',
    lastCheckedAt: '2026-08-30T03:41:00Z',
    evidenceCount: 3,
  },
  {
    id: 'I1',
    domain: 'processors',
    title: 'No personal data reaches a processor without a valid s.8(2) contract',
    statement:
      'Every processor that touches personal data is under an executed contract carrying the DPDP clause set.',
    actRef: 's.8(1)–(2)',
    type: 'preventive',
    status: 'pass',
    automation: 'semi',
    lastCheckedAt: '2026-08-30T04:20:00Z',
    evidenceCount: 3,
  },
  {
    id: 'J1',
    domain: 'transfers',
    title: 'Transfer register and restricted-country screening',
    statement:
      'Every flow of personal data out of India is recorded and screened against the government restriction list.',
    actRef: 's.16(1) · Rule 15',
    type: 'detective',
    status: 'pending',
    automation: 'semi',
    lastCheckedAt: '2026-08-20T00:00:00Z',
    evidenceCount: 3,
  },
  {
    id: 'K1',
    domain: 'governance',
    title: 'DPO or contact person published — and answering',
    statement:
      'The business contact for questions about processing is published on the website, app and in every notice.',
    actRef: 's.8(9) · Rule 9',
    type: 'preventive',
    status: 'pass',
    automation: 'semi',
    lastCheckedAt: '2026-09-01T00:00:00Z',
    evidenceCount: 3,
  },
  {
    id: 'K2',
    domain: 'governance',
    title: 'DPDP awareness and role-based training',
    statement:
      'Everyone who touches personal data is trained, with deeper training for high-risk roles.',
    actRef: 's.8(4) · s.33(2)(e)',
    type: 'preventive',
    status: 'pending',
    automation: 'semi',
    lastCheckedAt: '2026-08-12T00:00:00Z',
    evidenceCount: 3,
  },
];

export function getControl(id: string): Control | undefined {
  return CONTROLS.find((control) => control.id === id);
}

export function computeControlScore(): {
  overall: number;
  domainScores: Record<ControlDomainKey, number>;
} {
  const domainScores = {} as Record<ControlDomainKey, number>;
  for (const domain of CONTROL_DOMAIN_ORDER) {
    const domainControls = CONTROLS.filter((control) => control.domain === domain);
    const passing = domainControls.filter((control) => control.status === 'pass').length;
    domainScores[domain] =
      domainControls.length === 0 ? 0 : Math.round((passing / domainControls.length) * 100);
  }
  const overall = Math.round(
    (CONTROLS.filter((control) => control.status === 'pass').length / CONTROLS.length) * 100,
  );
  return { overall, domainScores };
}
