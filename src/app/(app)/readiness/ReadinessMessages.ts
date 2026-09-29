/** Page-local — copy for the Gap Assessment hub and report, resolved server-side in page.tsx. */
export type ReadinessMessages = {
  // Feature-domain tag pills (empty state)
  tagNotice: string;
  tagRights: string;
  tagSecurity: string;
  tagRetention: string;
  tagProcessors: string;
  tagTransfers: string;
  tagGovernance: string;

  // Empty state
  emptyTitle: string;
  emptyDescription: string;
  startCta: string;
  howScoredCta: string;
  baselineCaption: string;

  // Resume (in-progress) state
  resumeTitle: string;
  resumeAnsweredOf: string;
  resumeNextUp: string;
  resumeCta: string;
  changeScopeCta: string;
  kpiAnswered: string;
  kpiRemaining: string;
  kpiInScope: string;
  kpiNotApplicable: string;

  // Report state
  retakeCta: string;
  overallScoreLabel: string;
  lastAssessed: string;
  metaLine: string;
  bandReady: string;
  bandSubstantial: string;
  bandDeveloping: string;
  bandHighExposure: string;
  kpiCriticalGaps: string;
  kpiTotalGaps: string;
  kpiObligationsMet: string;
  kpiUnsureAnswers: string;
  domainScoresTitle: string;
  domainNotApplicable: string;
  gapsTitle: string;
  gapsDescription: string;
  gapsEmptyTitle: string;
  gapsEmptyDescription: string;
  tableDomain: string;
  tableIssue: string;
  tableSeverity: string;
  tableAction: string;
  fixLabel: string;
  unverifiedTag: string;
  severityCritical: string;
  severityHigh: string;
  severityMedium: string;
  severityLow: string;
};
