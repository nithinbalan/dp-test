import { getTranslator, type Translate } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { DATASETS } from '@shared/mock/data-map';
import { PEOPLE } from '@shared/mock/people';
import { GenerateRopaWizard } from './GenerateRopaWizard';
import type { GenerateRopaMessages } from './GenerateRopaWizard.types';

type T = Translate<'ropa'>;

function buildStep1Messages(t: T) {
  return {
    step1Heading: t('generateStep1Heading'),
    aiIntroWithEvidence: t('generateAiIntroWithEvidence'),
    aiIntroNoEvidence: t('generateAiIntroNoEvidence'),
    principalsTitle: t('generatePrincipalsTitle'),
    principalsSub: t('generatePrincipalsSub'),
    purposesTitle: t('generatePurposesTitle'),
    purposesSub: t('generatePurposesSub'),
    sourcesTitle: t('generateSourcesTitle'),
    sourcesSub: t('generateSourcesSub'),
    identifiedBannerWithEvidence: t('generateIdentifiedBannerWithEvidence'),
    identifiedBannerNoEvidence: t('generateIdentifiedBannerNoEvidence'),
  };
}

function buildStep2Messages(t: T) {
  return {
    step2Heading: t('generateStep2Heading'),
    step2AiIntro: t('generateStep2AiIntro'),
    processorsTitle: t('generateProcessorsTitle'),
    processorsSub: t('generateProcessorsSub'),
    recipientsTitle: t('generateRecipientsTitle'),
    recipientsSub: t('generateRecipientsSub'),
    locationTitle: t('generateLocationTitle'),
    locationSub: t('generateLocationSub'),
    xborderIndiaTitle: t('generateXborderIndiaTitle'),
    xborderIndiaCaption: t('generateXborderIndiaCaption'),
    xborderMultiTitle: t('generateXborderMultiTitle'),
    xborderMultiCaption: t('generateXborderMultiCaption'),
    xborderOtherTitle: t('generateXborderOtherTitle'),
    xborderOtherCaption: t('generateXborderOtherCaption'),
    xborderUnknownTitle: t('generateXborderUnknownTitle'),
    xborderUnknownCaption: t('generateXborderUnknownCaption'),
    retentionTitle: t('generateRetentionTitle'),
    retentionSub: t('generateRetentionSub'),
    retentionLawTitle: t('generateRetentionLawTitle'),
    retentionLawCaption: t('generateRetentionLawCaption'),
    retentionPolicyTitle: t('generateRetentionPolicyTitle'),
    retentionPolicyCaption: t('generateRetentionPolicyCaption'),
    retentionBusinessTitle: t('generateRetentionBusinessTitle'),
    retentionBusinessCaption: t('generateRetentionBusinessCaption'),
    retentionPurposeTitle: t('generateRetentionPurposeTitle'),
    retentionPurposeCaption: t('generateRetentionPurposeCaption'),
    retentionUnknownTitle: t('generateRetentionUnknownTitle'),
    retentionUnknownCaption: t('generateRetentionUnknownCaption'),
    retentionLawHint: t('generateRetentionLawHint'),
    retentionUnknownHint: t('generateRetentionUnknownHint'),
  };
}

function buildStep3Messages(t: T) {
  return {
    step3Heading: t('generateStep3Heading'),
    step3AiIntro: t('generateStep3AiIntro'),
    step3SuggestedPrefix: t('generateStep3SuggestedPrefix'),
    step3OwnerLabel: t('generateStep3OwnerLabel'),
  };
}

function buildStep4Messages(t: T) {
  return {
    step4Heading: t('generateStep4Heading'),
    chipActivities: t('kpiActivities'),
    chipDatasets: t('generateChipDatasets'),
    chipSources: t('generateChipSources'),
    chipProcessors: t('detailChipProcessors'),
    chipOwners: t('generateChipOwners'),
    qualityTitle: t('generateQualityTitle'),
    qualitySub: t('generateQualitySub'),
    qualityHighLabel: t('generateQualityHighLabel'),
    qualityHigh: t('generateQualityHigh'),
    qualityNeedsReviewLabel: t('generateQualityNeedsReviewLabel'),
    qualityNeedsReview: t('generateQualityNeedsReview'),
    qualityMissingLabel: t('generateQualityMissingLabel'),
    qualityMissing: t('generateQualityMissing'),
    tableActivity: t('tableActivity'),
    tableConfidence: t('generateTableConfidence'),
    tableEvidence: t('generateTableEvidence'),
    tableIssues: t('generateTableIssues'),
    noIssues: t('generateNoIssues'),
    evidenceSourcesSuffix: t('generateEvidenceSourcesSuffix'),
    evidenceLabel: t('generateEvidenceLabel'),
    confidenceHigh: t('generateConfidenceHigh'),
    confidenceMedium: t('generateConfidenceMedium'),
  };
}

function buildFooterMessages(t: T) {
  return {
    footerCancel: t('generateFooterCancel'),
    footerBack: t('wizardBack'),
    footerContinue: t('generateFooterContinue'),
    footerReviewBeforeGenerate: t('generateFooterReviewBeforeGenerate'),
    footerReviewIssues: t('generateFooterReviewIssues'),
    footerGenerate: t('generateFooterGenerate'),
    validationSelectOne: t('generateValidationSelectOne'),
    validationConfirmLocation: t('generateValidationConfirmLocation'),
    toastGenerated: t('generateToastGenerated'),
    toastReviewIssues: t('generateToastReviewIssues'),
  };
}

function buildMessages(t: T): GenerateRopaMessages {
  return {
    title: t('generateTitle'),
    refTag: t('generateRefTag'),
    intro: t('generateIntro'),
    stepperLabel: t('generateStepperLabel'),
    step1Label: t('generateStep1Label'),
    step2Label: t('generateStep2Label'),
    step3Label: t('generateStep3Label'),
    step4Label: t('generateStep4Label'),
    ...buildStep1Messages(t),
    ...buildStep2Messages(t),
    ...buildStep3Messages(t),
    ...buildStep4Messages(t),
    ...buildFooterMessages(t),
  };
}

export default async function GenerateRopaPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'ropa');

  const people = PEOPLE.slice(0, 20).map((person) => ({
    id: person.id,
    name: person.name,
    initials: person.initials,
    detail: person.role,
  }));

  return (
    <GenerateRopaWizard
      t={buildMessages(t)}
      people={people}
      datasetCount={DATASETS.length}
      sourceCount={new Set(DATASETS.map((d) => d.sourceId)).size}
    />
  );
}
