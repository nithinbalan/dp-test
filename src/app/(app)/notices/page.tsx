import { getTranslator, type Translate } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { NoticesList } from './NoticesList';
import type { NoticesMessages } from './NoticesMessages';

function buildMessages(t: Translate<'notices'>): NoticesMessages {
  return {
    emptyTitle: t('emptyTitle'),
    emptyDescription: t('emptyDescription'),
    emptyMeta: t('emptyMeta'),
    flowStepRopa: t('flowStepRopa'),
    flowStepAi: t('flowStepAi'),
    flowStepReview: t('flowStepReview'),
    flowStepPublish: t('flowStepPublish'),
    flowStepOutput: t('flowStepOutput'),
    cta: t('cta'),
    searchPlaceholder: t('searchPlaceholder'),
    statusAll: t('statusAll'),
    statusPublished: t('statusPublished'),
    statusDraft: t('statusDraft'),
    statusFilterLabel: t('statusFilterLabel'),
    languageAll: t('languageAll'),
    languageEnglish: t('languageEnglish'),
    languageFilterLabel: t('languageFilterLabel'),
    addNoticeCta: t('addNoticeCta'),
    tableCaption: t('tableCaption'),
    tableNotice: t('tableNotice'),
    noticeMeta: t('noticeMeta'),
    tableActivity: t('tableActivity'),
    tableLanguage: t('tableLanguage'),
    translationCountSuffix: t('translationCountSuffix'),
    tableStatus: t('tableStatus'),
    tableUpdated: t('tableUpdated'),
    tableActions: t('tableActions'),
    viewLabel: t('viewLabel'),
    editLabel: t('editLabel'),
    shareLabel: t('shareLabel'),
    publishRowLabel: t('publishRowLabel'),
    activityNotLinkedTitle: t('activityNotLinkedTitle'),
    activityNotLinkedCaption: t('activityNotLinkedCaption'),
    sourceNone: t('sourceNone'),
    noResultsTitle: t('noResultsTitle'),
    noResultsDescription: t('noResultsDescription'),
    loadErrorTitle: t('loadErrorTitle'),
    loadErrorDescription: t('loadErrorDescription'),
    footerSourceNote: t('footerSourceNote'),
    footerRefNote: t('footerRefNote'),
    shareModalTitle: t('shareModalTitle'),
    shareModalSub: t('shareModalSub'),
    sharePublicUrlTitle: t('sharePublicUrlTitle'),
    sharePublicUrlSub: t('sharePublicUrlSub'),
    sharePublicUrlHint: t('sharePublicUrlHint'),
    shareEmbedTitle: t('shareEmbedTitle'),
    shareEmbedSub: t('shareEmbedSub'),
    shareOfflineTitle: t('shareOfflineTitle'),
    shareOfflineSub: t('shareOfflineSub'),
    shareCopyUrl: t('shareCopyUrl'),
    shareOpenUrl: t('shareOpenUrl'),
    shareCopyEmbed: t('shareCopyEmbed'),
    sharePreview: t('sharePreview'),
    shareDownloadPdf: t('shareDownloadPdf'),
    previewHeaderTitle: t('previewHeaderTitle'),
    previewReadIn: t('previewReadIn'),
    previewMachineTranslated: t('previewMachineTranslated'),
    previewEffective: t('previewEffective'),
    previewPublishedWith: t('previewPublishedWith'),
    printCta: t('printCta'),
    closeCta: t('closeCta'),
    brandDomain: t('brandDomain'),
    toastCopiedUrl: t('toastCopiedUrl'),
    toastCopiedEmbed: t('toastCopiedEmbed'),
    toastPdfOpening: t('toastPdfOpening'),
    copyEmbedFailed: t('copyEmbedFailed'),
    paginationSummary: t('paginationSummary'),
    pageSizeLabel: t('pageSizeLabel'),
  };
}

/**
 * Server component resolves locale/copy only (ADR-0006) — the register itself is
 * fetched client-side by `NoticesList` via `useNotices()`.
 */
export default async function NoticesPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'notices');

  return (
    <NoticesList
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      t={buildMessages(t)}
    />
  );
}
