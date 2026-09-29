import { getTranslator } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { ACTIVITIES } from '@shared/mock/ropa';
import { NewNoticeView } from './NewNoticeView';
import type { NewNoticeMessages } from './NewNoticeMessages';

export default async function NewNoticePage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'notices');

  const activities = ACTIVITIES.map((activity) => ({
    id: activity.id,
    name: activity.name,
    purpose: activity.purpose,
    principals: activity.principals,
    dataCategories: activity.dataCategories,
    retention: activity.retention,
  }));

  const messages: NewNoticeMessages = {
    newTitle: t('newTitle'),
    newRefTag: t('newRefTag'),
    newDescription: t('newDescription'),
    backToNotices: t('backToNotices'),
    ropaOptionTitle: t('ropaOptionTitle'),
    ropaOptionDescription: t('ropaOptionDescription'),
    recommendedTag: t('recommendedTag'),
    ropaPickLabel: t('ropaPickLabel'),
    ropaPickHint: t('ropaPickHint'),
    ropaPickSelectPlaceholder: t('ropaPickSelectPlaceholder'),
    ropaGenerateCta: t('ropaGenerateCta'),
    ropaSummaryPurpose: t('ropaSummaryPurpose'),
    ropaSummaryData: t('ropaSummaryData'),
    ropaSummaryPrincipal: t('ropaSummaryPrincipal'),
    ropaSummaryRecipients: t('ropaSummaryRecipients'),
    ropaSummaryNoneRecorded: t('ropaSummaryNoneRecorded'),
    ropaSummaryRetention: t('ropaSummaryRetention'),
    ropaSummaryContact: t('ropaSummaryContact'),
    ropaSummaryNotConfigured: t('ropaSummaryNotConfigured'),
    ropaNoActivitiesText: t('ropaNoActivitiesText'),
    ropaBuildCta: t('ropaBuildCta'),
    scratchOptionTitle: t('scratchOptionTitle'),
    scratchOptionDescription: t('scratchOptionDescription'),
    scratchLabel: t('scratchLabel'),
    scratchHint: t('scratchHint'),
    scratchPlaceholder: t('scratchPlaceholder'),
    scratchCta: t('scratchCta'),
    draftOnlyHint: t('draftOnlyHint'),
    toastGenerated: t('toastGenerated'),
    toastGeneratedScratch: t('toastGeneratedScratch'),
    toastGenerateFailed: t('toastGenerateFailed'),
    generatedNoticeSuffix: t('generatedNoticeSuffix'),
    untitledNotice: t('untitledNotice'),
    genStepRopa1: t('genStepRopa1'),
    genStepRopa2: t('genStepRopa2'),
    genStepRopa3: t('genStepRopa3'),
    genStepScratch1: t('genStepScratch1'),
    genStepScratch2: t('genStepScratch2'),
    genStepScratch3: t('genStepScratch3'),
  };

  return <NewNoticeView pageRefTag={t('newRefTag')} t={messages} activities={activities} />;
}
