import type { Translate } from '@shared/lib';
import type { RiskLevel, RiskSourceType, RiskStatus } from '@shared/mock/grc';

/** Page-local — copy for the Risk Register, resolved server-side in page.tsx. */
export type RisksMessages = {
  kpiTotal: string;
  kpiOpen: string;
  kpiCritical: string;
  kpiClosed: string;
  searchPlaceholder: string;
  statusAll: string;
  statusOpen: string;
  statusMitigating: string;
  statusClosed: string;
  statusFilterLabel: string;
  tableCaption: string;
  tableRisk: string;
  tableDomain: string;
  tableSource: string;
  tableLevel: string;
  tableStatus: string;
  tableOwner: string;
  tableActions: string;
  viewLabel: string;
  levelLow: string;
  levelMedium: string;
  levelHigh: string;
  levelCritical: string;
  sourceControl: string;
  sourceGapAssessment: string;
  sourceDpia: string;
  backToRisks: string;
  likelihoodLabel: string;
  impactLabel: string;
  identifiedAtLabel: string;
  sourceRefLabel: string;
};

export function resolveRisksMessages(t: Translate<'risks'>): RisksMessages {
  return {
    kpiTotal: t('kpiTotal'),
    kpiOpen: t('kpiOpen'),
    kpiCritical: t('kpiCritical'),
    kpiClosed: t('kpiClosed'),
    searchPlaceholder: t('searchPlaceholder'),
    statusAll: t('statusAll'),
    statusOpen: t('statusOpen'),
    statusMitigating: t('statusMitigating'),
    statusClosed: t('statusClosed'),
    statusFilterLabel: t('statusFilterLabel'),
    tableCaption: t('tableCaption'),
    tableRisk: t('tableRisk'),
    tableDomain: t('tableDomain'),
    tableSource: t('tableSource'),
    tableLevel: t('tableLevel'),
    tableStatus: t('tableStatus'),
    tableOwner: t('tableOwner'),
    tableActions: t('tableActions'),
    viewLabel: t('viewLabel'),
    levelLow: t('levelLow'),
    levelMedium: t('levelMedium'),
    levelHigh: t('levelHigh'),
    levelCritical: t('levelCritical'),
    sourceControl: t('sourceControl'),
    sourceGapAssessment: t('sourceGapAssessment'),
    sourceDpia: t('sourceDpia'),
    backToRisks: t('backToRisks'),
    likelihoodLabel: t('likelihoodLabel'),
    impactLabel: t('impactLabel'),
    identifiedAtLabel: t('identifiedAtLabel'),
    sourceRefLabel: t('sourceRefLabel'),
  };
}

export function riskStatusLabel(t: RisksMessages, status: RiskStatus): string {
  if (status === 'open') return t.statusOpen;
  if (status === 'mitigating') return t.statusMitigating;
  return t.statusClosed;
}

export function riskLevelLabel(t: RisksMessages, level: RiskLevel): string {
  if (level === 'low') return t.levelLow;
  if (level === 'medium') return t.levelMedium;
  if (level === 'high') return t.levelHigh;
  return t.levelCritical;
}

export function riskSourceLabel(t: RisksMessages, source: RiskSourceType): string {
  if (source === 'control') return t.sourceControl;
  if (source === 'gap-assessment') return t.sourceGapAssessment;
  return t.sourceDpia;
}
