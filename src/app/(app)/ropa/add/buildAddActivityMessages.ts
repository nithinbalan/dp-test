import type { Translate } from '@shared/lib';
import type { AddActivityMessages } from './AddActivityWizard.types';

type T = Translate<'ropa'>;

function buildShellMessages(t: T) {
  return {
    wizardTitle: t('wizardTitle'),
    wizardBackCta: t('wizardBackCta'),
    wizardRefTag: t('wizardRefTag'),
    wizardDescription: t('wizardDescription'),
    wizardStepperLabel: t('wizardStepperLabel'),
    wizardStepBasics: t('wizardStepBasics'),
    wizardStepData: t('wizardStepData'),
    wizardStepRules: t('wizardStepRules'),
    wizardBack: t('wizardBack'),
    wizardCancel: t('wizardCancel'),
    wizardNext: t('wizardNext'),
    wizardSubmit: t('wizardSubmit'),
    toastActivityAdded: t('toastActivityAdded'),
    toastValidationStep: t('toastValidationStep'),
    toastValidationFinal: t('toastValidationFinal'),
    toastSaveError: t('toastSaveError'),
    wizardEditTitle: t('wizardEditTitle'),
    wizardEditRefTag: t('wizardEditRefTag'),
    footerSaveChanges: t('footerSaveChanges'),
    toastActivityUpdated: t('toastActivityUpdated'),
  };
}

function buildStep1Messages(t: T) {
  return {
    step1Heading: t('step1Heading'),
    step1Sub: t('step1Sub'),
    wizardNameLabel: t('wizardNameLabel'),
    wizardNameHint: t('wizardNameHint'),
    wizardNamePlaceholder: t('wizardNamePlaceholder'),
    wizardNameError: t('wizardNameError'),
    wizardPurposeLabel: t('wizardPurposeLabel'),
    wizardPurposeHint: t('wizardPurposeHint'),
    wizardPurposePlaceholder: t('wizardPurposePlaceholder'),
    wizardPurposeError: t('wizardPurposeError'),
    wizardPrincipalsLabel: t('wizardPrincipalsLabel'),
    wizardPrincipalsHint: t('wizardPrincipalsHint'),
    wizardPrincipalsPlaceholder: t('wizardPrincipalsPlaceholder'),
    wizardPrincipalsError: t('wizardPrincipalsError'),
    wizardPrincipalCustomers: t('wizardPrincipalCustomers'),
    wizardPrincipalConsumers: t('wizardPrincipalConsumers'),
    wizardPrincipalEmployees: t('wizardPrincipalEmployees'),
    wizardPrincipalCandidates: t('wizardPrincipalCandidates'),
    wizardPrincipalVendors: t('wizardPrincipalVendors'),
    wizardPrincipalMinors: t('wizardPrincipalMinors'),
    wizardPrincipalAll: t('wizardPrincipalAll'),
    wizardMinorsWarning: t('wizardMinorsWarning'),
  };
}

function buildStep2Messages(t: T) {
  return {
    step2Heading: t('step2Heading'),
    wizardIdentifiersLabel: t('wizardIdentifiersLabel'),
    wizardIdentifiersHint: t('wizardIdentifiersHint'),
    wizardIdentifiersError: t('wizardIdentifiersError'),
    wizardCollectionSourceLabel: t('wizardCollectionSourceLabel'),
    wizardCollectionSourceHint: t('wizardCollectionSourceHint'),
    wizardCollectionDirect: t('wizardCollectionDirect'),
    wizardCollectionPartner: t('wizardCollectionPartner'),
    wizardCollectionEmployee: t('wizardCollectionEmployee'),
    wizardCollectionGenerated: t('wizardCollectionGenerated'),
    wizardCollectionPublic: t('wizardCollectionPublic'),
    wizardStorageLabel: t('wizardStorageLabel'),
    wizardStorageHint: t('wizardStorageHint'),
  };
}

function buildStep3BasisMessages(t: T) {
  return {
    step3Heading: t('step3Heading'),
    wizardLawfulBasisLabel: t('wizardLawfulBasisLabel'),
    wizardLawfulBasisHint: t('wizardLawfulBasisHint'),
    wizardBasisError: t('wizardBasisError'),
    wizardBasisConsent: t('wizardBasisConsent'),
    wizardBasisConsentDesc: t('wizardBasisConsentDesc'),
    wizardBasisConsentRef: t('wizardBasisConsentRef'),
    wizardBasisVoluntary: t('wizardBasisVoluntary'),
    wizardBasisVoluntaryDesc: t('wizardBasisVoluntaryDesc'),
    wizardBasisVoluntaryRef: t('wizardBasisVoluntaryRef'),
    wizardBasisEmployment: t('wizardBasisEmployment'),
    wizardBasisEmploymentDesc: t('wizardBasisEmploymentDesc'),
    wizardBasisEmploymentRef: t('wizardBasisEmploymentRef'),
    wizardBasisLegal: t('wizardBasisLegal'),
    wizardBasisLegalDesc: t('wizardBasisLegalDesc'),
    wizardBasisLegalRef: t('wizardBasisLegalRef'),
    wizardBasisParental: t('wizardBasisParental'),
    wizardBasisParentalDesc: t('wizardBasisParentalDesc'),
    wizardBasisParentalRef: t('wizardBasisParentalRef'),
    wizardBasisSecurity: t('wizardBasisSecurity'),
    wizardBasisSecurityDesc: t('wizardBasisSecurityDesc'),
    wizardBasisSecurityRef: t('wizardBasisSecurityRef'),
  };
}

function buildStep3RestMessages(t: T) {
  return {
    wizardProcessorsLabel: t('wizardProcessorsLabel'),
    wizardProcessorsHint: t('wizardProcessorsHint'),
    wizardRetentionLabel: t('wizardRetentionLabel'),
    wizardRetentionUntilPurpose: t('wizardRetentionUntilPurpose'),
    wizardRetention12Months: t('wizardRetention12Months'),
    wizardRetention24Months: t('wizardRetention24Months'),
    wizardRetention8YearsTax: t('wizardRetention8YearsTax'),
    wizardRetentionKyc: t('wizardRetentionKyc'),
    wizardRetention90Days: t('wizardRetention90Days'),
    wizardRetentionMajority: t('wizardRetentionMajority'),
    wizardOwnerLabel: t('wizardOwnerLabel'),
    wizardOwnerError: t('wizardOwnerError'),
    wizardOwnerSearchPlaceholder: t('wizardOwnerSearchPlaceholder'),
    wizardOwnerEscHint: t('wizardOwnerEscHint'),
    wizardOwnerFooterLabel: t('wizardOwnerFooterLabel'),
    wizardOwnerManageLabel: t('wizardOwnerManageLabel'),
    wizardCrossBorderLabel: t('wizardCrossBorderLabel'),
    wizardCrossBorderIndia: t('wizardCrossBorderIndia'),
    wizardCrossBorderTransfer: t('wizardCrossBorderTransfer'),
    wizardAdvancedToggle: t('wizardAdvancedToggle'),
    wizardOperationsLabel: t('wizardOperationsLabel'),
    wizardOperationsHint: t('wizardOperationsHint'),
    wizardSecurityLabel: t('wizardSecurityLabel'),
    wizardSecurityHint: t('wizardSecurityHint'),
  };
}

/** Resolves every wizard copy key from the `ropa` namespace — shared by the add and edit pages so the ~90-key list is written once. */
export function buildAddActivityMessages(t: T): AddActivityMessages {
  return {
    ...buildShellMessages(t),
    ...buildStep1Messages(t),
    ...buildStep2Messages(t),
    ...buildStep3BasisMessages(t),
    ...buildStep3RestMessages(t),
  };
}
