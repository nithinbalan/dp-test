import type { Translate } from '@shared/lib';

/** Page-local — copy for the Controls · CCM register, resolved server-side in page.tsx. */
export type ControlsMessages = {
  overallScoreLabel: string;
  scoreBandStrong: string;
  scoreBandDeveloping: string;
  scoreBandAtRisk: string;
  kpiTotal: string;
  kpiPassing: string;
  kpiFailing: string;
  kpiPending: string;
  searchPlaceholder: string;
  statusAll: string;
  statusPass: string;
  statusFail: string;
  statusPending: string;
  statusFilterLabel: string;
  tableCaption: string;
  tableDomain: string;
  tableControl: string;
  tableType: string;
  tableStatus: string;
  tableAutomation: string;
  tableLastChecked: string;
  tableActions: string;
  viewLabel: string;
  typePreventive: string;
  typeDetective: string;
  typeCorrective: string;
  automationAuto: string;
  automationSemi: string;
  automationManual: string;
  domainLawfulBasis: string;
  domainNotice: string;
  domainConsent: string;
  domainChildren: string;
  domainRights: string;
  domainRetention: string;
  domainSecurity: string;
  domainBreach: string;
  domainProcessors: string;
  domainTransfers: string;
  domainGovernance: string;
  backToControls: string;
  statementLabel: string;
  actRefLabel: string;
  evidenceLabel: string;
  lastCheckedLabel: string;
};

/** Resolves every key `ControlsMessages` needs from the `controls` namespace. */
export function resolveControlsMessages(t: Translate<'controls'>): ControlsMessages {
  return {
    overallScoreLabel: t('overallScoreLabel'),
    scoreBandStrong: t('scoreBandStrong'),
    scoreBandDeveloping: t('scoreBandDeveloping'),
    scoreBandAtRisk: t('scoreBandAtRisk'),
    kpiTotal: t('kpiTotal'),
    kpiPassing: t('kpiPassing'),
    kpiFailing: t('kpiFailing'),
    kpiPending: t('kpiPending'),
    searchPlaceholder: t('searchPlaceholder'),
    statusAll: t('statusAll'),
    statusPass: t('statusPass'),
    statusFail: t('statusFail'),
    statusPending: t('statusPending'),
    statusFilterLabel: t('statusFilterLabel'),
    tableCaption: t('tableCaption'),
    tableDomain: t('tableDomain'),
    tableControl: t('tableControl'),
    tableType: t('tableType'),
    tableStatus: t('tableStatus'),
    tableAutomation: t('tableAutomation'),
    tableLastChecked: t('tableLastChecked'),
    tableActions: t('tableActions'),
    viewLabel: t('viewLabel'),
    typePreventive: t('typePreventive'),
    typeDetective: t('typeDetective'),
    typeCorrective: t('typeCorrective'),
    automationAuto: t('automationAuto'),
    automationSemi: t('automationSemi'),
    automationManual: t('automationManual'),
    domainLawfulBasis: t('domainLawfulBasis'),
    domainNotice: t('domainNotice'),
    domainConsent: t('domainConsent'),
    domainChildren: t('domainChildren'),
    domainRights: t('domainRights'),
    domainRetention: t('domainRetention'),
    domainSecurity: t('domainSecurity'),
    domainBreach: t('domainBreach'),
    domainProcessors: t('domainProcessors'),
    domainTransfers: t('domainTransfers'),
    domainGovernance: t('domainGovernance'),
    backToControls: t('backToControls'),
    statementLabel: t('statementLabel'),
    actRefLabel: t('actRefLabel'),
    evidenceLabel: t('evidenceLabel'),
    lastCheckedLabel: t('lastCheckedLabel'),
  };
}
