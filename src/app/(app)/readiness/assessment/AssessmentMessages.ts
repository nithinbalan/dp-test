/** Page-local — copy for the guided Gap Assessment wizard, resolved server-side in page.tsx. */
export type AssessmentMessages = {
  wizardTitle: string;
  wizardStepperLabel: string;
  wizardBack: string;
  wizardSaveExit: string;
  wizardNext: string;
  wizardSubmit: string;
  wizardGenerating: string;
  wizardProgressLabel: string;
  wizardProgress: string;
  wizardJumpUnanswered: string;
  wizardLeftToUnlock: string;
  toastScopeRequired: string;
  toastSavedProgress: string;
  toastAssessmentComplete: string;

  // Dev-only "Skip ahead" sample-fill bar — never rendered in production
  demoBarTitle: string;
  demoBarBadge: string;
  demoBarBody: string;
  demoSelectLabel: string;
  demoFillCta: string;
  demoGenerateCta: string;
  demoFilledToast: string;
  demoGeneratingToast: string;

  // Step 1 — scope/profile
  profileHeading: string;
  profileIntro: string;
  fieldEntityName: string;
  fieldCompletedBy: string;
  fieldCompletedByHint: string;
  fieldCompletedBySearchPlaceholder: string;
  fieldCompletedByEscHint: string;
  fieldCompletedByFooterLabel: string;
  fieldCompletedByManageLabel: string;
  fieldSector: string;
  fieldSectorHint: string;
  fieldRecordsHeld: string;
  fieldRecordsHeldHint: string;
  gateKidsLabel: string;
  gateKidsHint: string;
  gateProcLabel: string;
  gateProcHint: string;
  gateXbtLabel: string;
  gateXbtHint: string;
  gateSensLabel: string;
  gateSensHint: string;
  scopeSummaryCount: string;
  scopeSummaryAllInScope: string;
  scopeSummaryExcluded: string;
  scopeSummaryUnsureNote: string;
  scopeSummaryConjunction: string;
  sdfNoteTitle: string;
  sdfNoteBody: string;
  sdfReasonVolume: string;
  sdfReasonSensitivity: string;
  sdfReasonChildren: string;

  // Steps 2–6 — questions
  answerYes: string;
  answerPartly: string;
  answerNo: string;
  answerNotSure: string;
  tagMustHave: string;
  tagWeight: string;
  questionNoteToggle: string;
  questionNotePlaceholder: string;
  domainQuestionCount: string;
  domainNotApplicableNote: string;
};
