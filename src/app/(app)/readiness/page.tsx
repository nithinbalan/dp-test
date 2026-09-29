import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { ReadinessHub } from './ReadinessHub';
import type { ReadinessMessages } from './ReadinessMessages';

export default async function ReadinessPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'readiness');

  const messages: ReadinessMessages = {
    tagNotice: t('tagNotice'),
    tagRights: t('tagRights'),
    tagSecurity: t('tagSecurity'),
    tagRetention: t('tagRetention'),
    tagProcessors: t('tagProcessors'),
    tagTransfers: t('tagTransfers'),
    tagGovernance: t('tagGovernance'),
    emptyTitle: t('emptyTitle'),
    emptyDescription: t('emptyDescription'),
    startCta: t('startCta'),
    howScoredCta: t('howScoredCta'),
    baselineCaption: t('baselineCaption'),
    resumeTitle: t('resumeTitle'),
    resumeAnsweredOf: t('resumeAnsweredOf'),
    resumeNextUp: t('resumeNextUp'),
    resumeCta: t('resumeCta'),
    changeScopeCta: t('changeScopeCta'),
    kpiAnswered: t('kpiAnswered'),
    kpiRemaining: t('kpiRemaining'),
    kpiInScope: t('kpiInScope'),
    kpiNotApplicable: t('kpiNotApplicable'),
    retakeCta: t('retakeCta'),
    overallScoreLabel: t('overallScoreLabel'),
    lastAssessed: t('lastAssessed'),
    metaLine: t('metaLine'),
    bandReady: t('bandReady'),
    bandSubstantial: t('bandSubstantial'),
    bandDeveloping: t('bandDeveloping'),
    bandHighExposure: t('bandHighExposure'),
    kpiCriticalGaps: t('kpiCriticalGaps'),
    kpiTotalGaps: t('kpiTotalGaps'),
    kpiObligationsMet: t('kpiObligationsMet'),
    kpiUnsureAnswers: t('kpiUnsureAnswers'),
    domainScoresTitle: t('domainScoresTitle'),
    domainNotApplicable: t('domainNotApplicable'),
    gapsTitle: t('gapsTitle'),
    gapsDescription: t('gapsDescription'),
    gapsEmptyTitle: t('gapsEmptyTitle'),
    gapsEmptyDescription: t('gapsEmptyDescription'),
    tableDomain: t('tableDomain'),
    tableIssue: t('tableIssue'),
    tableSeverity: t('tableSeverity'),
    tableAction: t('tableAction'),
    fixLabel: t('fixLabel'),
    unverifiedTag: t('unverifiedTag'),
    severityCritical: t('severityCritical'),
    severityHigh: t('severityHigh'),
    severityMedium: t('severityMedium'),
    severityLow: t('severityLow'),
  };

  return (
    <ReadinessHub
      t={messages}
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
    />
  );
}
