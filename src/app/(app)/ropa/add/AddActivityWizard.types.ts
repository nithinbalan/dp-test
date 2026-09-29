/** Page-local — copy for the Add Activity wizard, resolved server-side in page.tsx. */
export type AddActivityMessages = {
  wizardTitle: string;
  wizardBackCta: string;
  wizardRefTag: string;
  wizardDescription: string;
  wizardStepperLabel: string;
  wizardStepBasics: string;
  wizardStepData: string;
  wizardStepRules: string;

  step1Heading: string;
  step1Sub: string;
  wizardNameLabel: string;
  wizardNameHint: string;
  wizardNamePlaceholder: string;
  wizardNameError: string;
  wizardPurposeLabel: string;
  wizardPurposeHint: string;
  wizardPurposePlaceholder: string;
  wizardPurposeError: string;
  wizardPrincipalsLabel: string;
  wizardPrincipalsHint: string;
  wizardPrincipalsPlaceholder: string;
  wizardPrincipalsError: string;
  wizardPrincipalCustomers: string;
  wizardPrincipalConsumers: string;
  wizardPrincipalEmployees: string;
  wizardPrincipalCandidates: string;
  wizardPrincipalVendors: string;
  wizardPrincipalMinors: string;
  wizardPrincipalAll: string;
  wizardMinorsWarning: string;

  step2Heading: string;
  wizardIdentifiersLabel: string;
  wizardIdentifiersHint: string;
  wizardIdentifiersError: string;
  wizardCollectionSourceLabel: string;
  wizardCollectionSourceHint: string;
  wizardCollectionDirect: string;
  wizardCollectionPartner: string;
  wizardCollectionEmployee: string;
  wizardCollectionGenerated: string;
  wizardCollectionPublic: string;
  wizardStorageLabel: string;
  wizardStorageHint: string;

  step3Heading: string;
  wizardLawfulBasisLabel: string;
  wizardLawfulBasisHint: string;
  wizardBasisError: string;
  wizardBasisConsent: string;
  wizardBasisConsentDesc: string;
  wizardBasisConsentRef: string;
  wizardBasisVoluntary: string;
  wizardBasisVoluntaryDesc: string;
  wizardBasisVoluntaryRef: string;
  wizardBasisEmployment: string;
  wizardBasisEmploymentDesc: string;
  wizardBasisEmploymentRef: string;
  wizardBasisLegal: string;
  wizardBasisLegalDesc: string;
  wizardBasisLegalRef: string;
  wizardBasisParental: string;
  wizardBasisParentalDesc: string;
  wizardBasisParentalRef: string;
  wizardBasisSecurity: string;
  wizardBasisSecurityDesc: string;
  wizardBasisSecurityRef: string;
  wizardProcessorsLabel: string;
  wizardProcessorsHint: string;
  wizardRetentionLabel: string;
  wizardRetentionUntilPurpose: string;
  wizardRetention12Months: string;
  wizardRetention24Months: string;
  wizardRetention8YearsTax: string;
  wizardRetentionKyc: string;
  wizardRetention90Days: string;
  wizardRetentionMajority: string;
  wizardOwnerLabel: string;
  wizardOwnerError: string;
  wizardOwnerSearchPlaceholder: string;
  wizardOwnerEscHint: string;
  wizardOwnerFooterLabel: string;
  wizardOwnerManageLabel: string;
  wizardCrossBorderLabel: string;
  wizardCrossBorderIndia: string;
  wizardCrossBorderTransfer: string;
  wizardAdvancedToggle: string;
  wizardOperationsLabel: string;
  wizardOperationsHint: string;
  wizardSecurityLabel: string;
  wizardSecurityHint: string;

  wizardBack: string;
  wizardCancel: string;
  wizardNext: string;
  wizardSubmit: string;
  toastActivityAdded: string;
  toastValidationStep: string;
  toastValidationFinal: string;
  toastSaveError: string;

  wizardEditTitle: string;
  wizardEditRefTag: string;
  footerSaveChanges: string;
  toastActivityUpdated: string;
};

/** Present only when the wizard is editing an existing activity, not drafting a new one. */
export type EditingActivity = {
  id: string;
  refCode: string;
  ownerName: string;
};

/** Which required fields failed validation — presence of a key IS the invalid state, mirroring `Field`'s `errorMessage` convention. */
export type AddActivityFieldErrors = {
  name?: boolean;
  purpose?: boolean;
  principals?: boolean;
  identifiers?: boolean;
  lawfulBasis?: boolean;
  ownerId?: boolean;
};

export type AddActivityState = {
  name: string;
  purpose: string;
  principals: string;
  identifiers: string[];
  collectionSource: string;
  storageLocations: string[];
  retention: string;
  lawfulBasis: string;
  processors: string[];
  ownerId: string | undefined;
  crossBorder: 'india' | 's16';
  operations: string[];
  securityMeasures: string[];
};
