/** Page-local — copy for the RoPA activity detail view, resolved server-side in page.tsx. */
export type ActivityDetailMessages = {
  backCta: string;
  refLabel: string;
  loadErrorTitle: string;
  loadErrorDescription: string;
  ownerPrefix: string;
  statusApproved: string;
  statusNeedsReview: string;
  statusAiDraft: string;
  actionApprove: string;
  actionEdit: string;
  toastApproved: string;

  chipConfidence: string;
  chipSourceManual: string;
  chipSourceLabel: string;
  chipEvidenceSources: string;
  chipLastReviewed: string;
  chipProcessors: string;

  fullRecordTitle: string;
  fullRecordSub: string;
  rowActivity: string;
  rowPurpose: string;
  rowSubjects: string;
  rowPersonalData: string;
  rowSource: string;
  rowOperations: string;
  rowSystems: string;
  rowStorage: string;
  rowProcessors: string;
  rowRecipients: string;
  rowCrossBorder: string;
  rowLawfulBasis: string;
  rowRetention: string;
  rowSecurity: string;
  rowOwner: string;
  none: string;
  noneRecorded: string;
  unknown: string;
  resolveCta: string;
  resolveToast: string;

  whyTitle: string;
  whySignals: string;
  whyInference: string;
  whyConfidence: string;

  evidenceTitle: string;
  evidenceSub: string;
  evidenceEmpty: string;

  approvalTitle: string;
  approvalSub: string;
  approvalStatusLabel: string;
  approvalReviewer: string;
  approvalReviewerPending: string;
  approvalDate: string;
  approvalVersion: string;
  approvalSnapshot: string;
  approvalSnapshotValue: string;

  historyTitle: string;
  historyEmpty: string;

  monitoringTitle: string;
  monitoringWatching: string;
  monitoringWatchingValue: string;
  monitoringOnChange: string;
  monitoringOnChangeValue: string;

  historyApprovedTemplate: string;
  justNowLabel: string;
};
