import type { Translate } from '@shared/lib';

/** Page-local — copy for the populated RoPA view, resolved server-side in page.tsx. */
export type RopaMessages = {
  // KPI stats
  kpiActivities: string;
  kpiApproved: string;
  kpiNeedsReview: string;
  kpiUnlinkedDatasets: string;

  // Action cluster
  ctaApproveAll: string;
  ctaHowItWorks: string;
  ctaExport: string;
  ctaGenerate: string;
  ctaRefineRegenerate: string;
  toastExport: string;
  toastGenerate: string;

  // Empty state
  emptyTitle: string;
  emptyDescriptionWithEvidence: string;
  emptyDescriptionNoEvidence: string;
  cta: string;
  emptyOrLabel: string;
  quickDraftHint: string;
  emptyHintLine: string;
  tertiaryCta: string;

  // Filter toolbar
  searchPlaceholder: string;
  statusFilterLabel: string;
  statusAll: string;
  statusApproved: string;
  statusNeedsReview: string;
  statusAiDraft: string;
  principalsFilterLabel: string;
  principalsAll: string;
  basisFilterLabel: string;
  basisAll: string;
  ownerFilterLabel: string;
  ownerAll: string;
  addActivityCta: string;
  quickDraftPlaceholder: string;
  quickDraftCta: string;

  // Table
  tableCaption: string;
  tableActivity: string;
  tablePrincipals: string;
  tableCategories: string;
  tableBasis: string;
  tableOwner: string;
  tableStatus: string;
  tableActions: string;
  tableSourcesSuffix: string;
  actionApprove: string;
  actionEdit: string;
  noResultsTitle: string;
  noResultsDescription: string;
  toastApproved: string;

  // Footer
  footerRef: string;
  footerId: string;

  // Info modal
  infoModalLabel: string;
  infoModalRefTag: string;
  infoModalDescription: string;
  infoModalPanelTitle: string;
  infoModalPanelSub: string;
  infoModalStep1: string;
  infoModalStep1Body: string;
  infoModalStep2: string;
  infoModalStep2Body: string;
  infoModalStep3: string;
  infoModalStep3Body: string;
  infoModalMonitorTitle: string;
  infoModalMonitorSub: string;
  infoModalTrigger1Cause: string;
  infoModalTrigger1Effect: string;
  infoModalTrigger2Cause: string;
  infoModalTrigger2Effect: string;
  infoModalTrigger3Cause: string;
  infoModalTrigger3Effect: string;
  closeLabel: string;

  toastDraftedWithAi: string;
};

type T = Translate<'ropa'>;

function resolveKpiAndActionMessages(t: T) {
  return {
    kpiActivities: t('kpiActivities'),
    kpiApproved: t('kpiApproved'),
    kpiNeedsReview: t('kpiNeedsReview'),
    kpiUnlinkedDatasets: t('kpiUnlinkedDatasets'),
    ctaApproveAll: t('ctaApproveAll'),
    ctaHowItWorks: t('ctaHowItWorks'),
    ctaExport: t('ctaExport'),
    ctaGenerate: t('ctaGenerate'),
    ctaRefineRegenerate: t('ctaRefineRegenerate'),
    toastExport: t('toastExport'),
    toastGenerate: t('toastGenerate'),
  };
}

function resolveEmptyStateMessages(t: T) {
  return {
    emptyTitle: t('emptyTitle'),
    emptyDescriptionWithEvidence: t('emptyDescriptionWithEvidence'),
    emptyDescriptionNoEvidence: t('emptyDescriptionNoEvidence'),
    cta: t('cta'),
    emptyOrLabel: t('emptyOrLabel'),
    quickDraftHint: t('quickDraftHint'),
    emptyHintLine: t('emptyHintLine'),
    tertiaryCta: t('tertiaryCta'),
  };
}

function resolveFilterMessages(t: T) {
  return {
    searchPlaceholder: t('searchPlaceholder'),
    statusFilterLabel: t('statusFilterLabel'),
    statusAll: t('statusAll'),
    statusApproved: t('statusApproved'),
    statusNeedsReview: t('statusNeedsReview'),
    statusAiDraft: t('statusAiDraft'),
    principalsFilterLabel: t('principalsFilterLabel'),
    principalsAll: t('principalsAll'),
    basisFilterLabel: t('basisFilterLabel'),
    basisAll: t('basisAll'),
    ownerFilterLabel: t('ownerFilterLabel'),
    ownerAll: t('ownerAll'),
    addActivityCta: t('addActivityCta'),
    quickDraftPlaceholder: t('quickDraftPlaceholder'),
    quickDraftCta: t('quickDraftCta'),
  };
}

function resolveTableMessages(t: T) {
  return {
    tableCaption: t('tableCaption'),
    tableActivity: t('tableActivity'),
    tablePrincipals: t('tablePrincipals'),
    tableCategories: t('tableCategories'),
    tableBasis: t('tableBasis'),
    tableOwner: t('tableOwner'),
    tableStatus: t('tableStatus'),
    tableActions: t('tableActions'),
    tableSourcesSuffix: t('tableSourcesSuffix'),
    actionApprove: t('actionApprove'),
    actionEdit: t('actionEdit'),
    noResultsTitle: t('noResultsTitle'),
    noResultsDescription: t('noResultsDescription'),
    toastApproved: t('toastApproved'),
    footerRef: t('footerRef'),
    footerId: t('footerId'),
  };
}

function resolveInfoModalMessages(t: T) {
  return {
    infoModalLabel: t('infoModalLabel'),
    infoModalRefTag: t('infoModalRefTag'),
    infoModalDescription: t('infoModalDescription'),
    infoModalPanelTitle: t('infoModalPanelTitle'),
    infoModalPanelSub: t('infoModalPanelSub'),
    infoModalStep1: t('infoModalStep1'),
    infoModalStep1Body: t('infoModalStep1Body'),
    infoModalStep2: t('infoModalStep2'),
    infoModalStep2Body: t('infoModalStep2Body'),
    infoModalStep3: t('infoModalStep3'),
    infoModalStep3Body: t('infoModalStep3Body'),
    infoModalMonitorTitle: t('infoModalMonitorTitle'),
    infoModalMonitorSub: t('infoModalMonitorSub'),
    infoModalTrigger1Cause: t('infoModalTrigger1Cause'),
    infoModalTrigger1Effect: t('infoModalTrigger1Effect'),
    infoModalTrigger2Cause: t('infoModalTrigger2Cause'),
    infoModalTrigger2Effect: t('infoModalTrigger2Effect'),
    infoModalTrigger3Cause: t('infoModalTrigger3Cause'),
    infoModalTrigger3Effect: t('infoModalTrigger3Effect'),
    closeLabel: t('closeLabel'),
    toastDraftedWithAi: t('toastDraftedWithAi'),
  };
}

export function resolveRopaMessages(t: T): RopaMessages {
  return {
    ...resolveKpiAndActionMessages(t),
    ...resolveEmptyStateMessages(t),
    ...resolveFilterMessages(t),
    ...resolveTableMessages(t),
    ...resolveInfoModalMessages(t),
  };
}
