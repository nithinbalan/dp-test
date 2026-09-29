import type { Translate } from '@shared/lib';

/** Page-local — copy for the DPIA screening register, resolved server-side in page.tsx. */
export type DpiaMessages = {
  kpiScreened: string;
  kpiRequired: string;
  kpiCompleted: string;
  kpiHighRisk: string;
  tableCaption: string;
  tableActivity: string;
  tableReason: string;
  tableRiskLevel: string;
  tableStatus: string;
  tableOwner: string;
  tableUpdated: string;
  tableActions: string;
  viewLabel: string;
  statusNotStarted: string;
  statusInProgress: string;
  statusCompleted: string;
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
  clearedNote: string;
  backToDpia: string;
  identifiedRisksLabel: string;
  requiredReasonLabel: string;
};

export function resolveDpiaMessages(t: Translate<'dpia'>): DpiaMessages {
  return {
    kpiScreened: t('kpiScreened'),
    kpiRequired: t('kpiRequired'),
    kpiCompleted: t('kpiCompleted'),
    kpiHighRisk: t('kpiHighRisk'),
    tableCaption: t('tableCaption'),
    tableActivity: t('tableActivity'),
    tableReason: t('tableReason'),
    tableRiskLevel: t('tableRiskLevel'),
    tableStatus: t('tableStatus'),
    tableOwner: t('tableOwner'),
    tableUpdated: t('tableUpdated'),
    tableActions: t('tableActions'),
    viewLabel: t('viewLabel'),
    statusNotStarted: t('statusNotStarted'),
    statusInProgress: t('statusInProgress'),
    statusCompleted: t('statusCompleted'),
    riskLow: t('riskLow'),
    riskMedium: t('riskMedium'),
    riskHigh: t('riskHigh'),
    clearedNote: t('clearedNote'),
    backToDpia: t('backToDpia'),
    identifiedRisksLabel: t('identifiedRisksLabel'),
    requiredReasonLabel: t('requiredReasonLabel'),
  };
}

export function dpiaStatusLabel(
  t: DpiaMessages,
  status: 'not-started' | 'in-progress' | 'completed',
): string {
  if (status === 'not-started') return t.statusNotStarted;
  if (status === 'in-progress') return t.statusInProgress;
  return t.statusCompleted;
}

export function dpiaRiskLabel(t: DpiaMessages, level: 'low' | 'medium' | 'high'): string {
  if (level === 'low') return t.riskLow;
  if (level === 'medium') return t.riskMedium;
  return t.riskHigh;
}
