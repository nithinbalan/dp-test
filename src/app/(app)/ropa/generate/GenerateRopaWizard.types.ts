/** Page-local — copy for the "Generate your RoPA with Jethur AI" interview wizard. */
export type GenerateRopaMessages = {
  title: string;
  refTag: string;
  intro: string;
  stepperLabel: string;
  step1Label: string;
  step2Label: string;
  step3Label: string;
  step4Label: string;

  step1Heading: string;
  aiIntroWithEvidence: string;
  aiIntroNoEvidence: string;
  principalsTitle: string;
  principalsSub: string;
  purposesTitle: string;
  purposesSub: string;
  sourcesTitle: string;
  sourcesSub: string;
  identifiedBannerWithEvidence: string;
  identifiedBannerNoEvidence: string;

  step2Heading: string;
  step2AiIntro: string;
  processorsTitle: string;
  processorsSub: string;
  recipientsTitle: string;
  recipientsSub: string;
  locationTitle: string;
  locationSub: string;
  xborderIndiaTitle: string;
  xborderIndiaCaption: string;
  xborderMultiTitle: string;
  xborderMultiCaption: string;
  xborderOtherTitle: string;
  xborderOtherCaption: string;
  xborderUnknownTitle: string;
  xborderUnknownCaption: string;
  retentionTitle: string;
  retentionSub: string;
  retentionLawTitle: string;
  retentionLawCaption: string;
  retentionPolicyTitle: string;
  retentionPolicyCaption: string;
  retentionBusinessTitle: string;
  retentionBusinessCaption: string;
  retentionPurposeTitle: string;
  retentionPurposeCaption: string;
  retentionUnknownTitle: string;
  retentionUnknownCaption: string;
  retentionLawHint: string;
  retentionUnknownHint: string;

  step3Heading: string;
  step3AiIntro: string;
  step3SuggestedPrefix: string;
  step3OwnerLabel: string;

  step4Heading: string;
  chipActivities: string;
  chipDatasets: string;
  chipSources: string;
  chipProcessors: string;
  chipOwners: string;
  qualityTitle: string;
  qualitySub: string;
  qualityHighLabel: string;
  qualityHigh: string;
  qualityNeedsReviewLabel: string;
  qualityNeedsReview: string;
  qualityMissingLabel: string;
  qualityMissing: string;
  tableActivity: string;
  tableConfidence: string;
  tableEvidence: string;
  tableIssues: string;
  noIssues: string;
  evidenceSourcesSuffix: string;

  evidenceLabel: string;
  confidenceHigh: string;
  confidenceMedium: string;

  footerCancel: string;
  footerBack: string;
  footerContinue: string;
  footerReviewBeforeGenerate: string;
  footerReviewIssues: string;
  footerGenerate: string;

  validationSelectOne: string;
  validationConfirmLocation: string;
  toastGenerated: string;
  toastReviewIssues: string;
};
