/**
 * MOCK DATA — see the note in `workspace.ts`. DPIA screening — which RoPA
 * activities require an impact assessment, and where each one stands.
 * `/dpia` reads this file; `risks.ts` and `grc.ts` reference DPIA ids as a
 * risk source.
 */
import { ACTIVITIES, type ProcessingActivity } from './ropa';

export type DpiaStatus = 'not-started' | 'in-progress' | 'completed';
export type DpiaRiskLevel = 'low' | 'medium' | 'high';

export type DpiaRecord = {
  id: string;
  activityId: string;
  activityName: string;
  requiredReason: string;
  status: DpiaStatus;
  riskLevel: DpiaRiskLevel;
  identifiedRisks: number;
  ownerId: string;
  updatedAt: string;
};

const SENSITIVE_CATEGORIES = ['Aadhaar number', 'PAN', 'Financial data', 'Resume data'];

function requiresDpia(activity: ProcessingActivity): boolean {
  return activity.dataCategories.some((category) => SENSITIVE_CATEGORIES.includes(category));
}

export const DPIA_CANDIDATE_ACTIVITIES: ProcessingActivity[] = ACTIVITIES.filter(requiresDpia);

export const DPIAS: DpiaRecord[] = [
  {
    id: 'dpia-1',
    activityId: 'ropa-2',
    activityName: 'Payroll processing',
    requiredReason: 'Processes Aadhaar, PAN and financial data',
    status: 'completed',
    riskLevel: 'high',
    identifiedRisks: 2,
    ownerId: 'person-3',
    updatedAt: '2026-08-22T00:00:00Z',
  },
  {
    id: 'dpia-2',
    activityId: 'ropa-4',
    activityName: 'Payment processing',
    requiredReason: 'Processes customer financial data',
    status: 'in-progress',
    riskLevel: 'medium',
    identifiedRisks: 1,
    ownerId: 'person-5',
    updatedAt: '2026-08-28T00:00:00Z',
  },
  {
    id: 'dpia-3',
    activityId: 'ropa-5',
    activityName: 'Candidate recruitment',
    requiredReason: 'Processes resume data for background evaluation',
    status: 'not-started',
    riskLevel: 'medium',
    identifiedRisks: 0,
    ownerId: 'person-3',
    updatedAt: '2026-08-15T00:00:00Z',
  },
];

export function getDpia(id: string): DpiaRecord | undefined {
  return DPIAS.find((dpia) => dpia.id === id);
}
