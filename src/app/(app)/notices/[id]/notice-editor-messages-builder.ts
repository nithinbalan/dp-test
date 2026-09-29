/**
 * Builds `NoticeEditorMessages` from the `notices` translator. Split into
 * grouped helpers only so no single function (this one included) needs to
 * hold all ~130 keys at once — `page.tsx` just merges the groups.
 */
import type { Translate } from '@shared/lib/messages';
import type { NoticeEditorMessages } from './NoticeEditorMessages';

type Translator = Translate<'notices'>;

function buildHeaderMessages(t: Translator) {
  return {
    backToNotices: t('backToNotices'),
    namePlaceholder: t('namePlaceholder'),
    metaDraft: t('metaDraft'),
    metaPublished: t('metaPublished'),
    noticeMetaLine: t('noticeMetaLine'),
    docHeaderMeta: t('docHeaderMeta'),
    languageSelectLabel: t('languageSelectLabel'),
    saveDraftCta: t('saveDraftCta'),
    publishCta: t('publishCta'),
    publishUpdateCta: t('publishUpdateCta'),
    shareEmbedLink: t('shareEmbedLink'),
    addTranslationCta: t('addTranslationCta'),
    addSectionCta: t('addSectionCta'),
    viewPublishedCta: t('viewPublishedCta'),
  };
}

function buildSourceMessages(t: Translator) {
  return {
    sourceCardTitle: t('sourceCardTitle'),
    sourceCardGeneratedTitle: t('sourceCardGeneratedTitle'),
    sourceActivityLabel: t('sourceActivityLabel'),
    sourceNone: t('sourceNone'),
    sourceFromScratchHint: t('sourceFromScratchHint'),
    sourceFromRopaHint: t('sourceFromRopaHint'),
    sourceRopaUsed: t('sourceRopaUsed'),
    defaultActivityName: t('defaultActivityName'),
    openRopaCta: t('openRopaCta'),
    viewRopaCta: t('viewRopaCta'),
    checkAgainstRopaCta: t('checkAgainstRopaCta'),
    comparingLabel: t('comparingLabel'),
    ropaSummaryPurpose: t('ropaSummaryPurpose'),
    ropaSummaryData: t('ropaSummaryData'),
    ropaSummaryPrincipal: t('ropaSummaryPrincipal'),
    ropaSummaryRecipients: t('ropaSummaryRecipients'),
    ropaSummaryRetention: t('ropaSummaryRetention'),
    ropaSummaryContact: t('ropaSummaryContact'),
  };
}

function buildCheckMessages(t: Translator) {
  return {
    checkCardTitle: t('checkCardTitle'),
    checkCardDescription: t('checkCardDescription'),
    checkCta: t('checkCta'),
    checkingLabel: t('checkingLabel'),
    checkPass: t('checkPass'),
    checkFail: t('checkFail'),
    checkPurposeMatch: t('checkPurposeMatch'),
    checkPurposeMissing: t('checkPurposeMissing'),
    checkDataMatch: t('checkDataMatch'),
    checkDataMissing: t('checkDataMissing'),
    checkShareMatch: t('checkShareMatch'),
    checkShareMissing: t('checkShareMissing'),
    checkKeepMatch: t('checkKeepMatch'),
    checkKeepMissing: t('checkKeepMissing'),
    checkRightsMatch: t('checkRightsMatch'),
    checkRightsMissing: t('checkRightsMissing'),
    checkContactMatch: t('checkContactMatch'),
    checkContactMissing: t('checkContactMissing'),
    checkMissingSections: t('checkMissingSections'),
  };
}

function buildAiMessages(t: Translator) {
  return {
    aiCardTitle: t('aiCardTitle'),
    aiCardHintDefault: t('aiCardHintDefault'),
    aiCardHintWorking: t('aiCardHintWorking'),
    aiImprove: t('aiImprove'),
    aiSimplify: t('aiSimplify'),
    aiRewrite: t('aiRewrite'),
    aiTranslate: t('aiTranslate'),
    aiFix: t('aiFix'),
    ropaPurposeMatch: t('ropaPurposeMatch'),
    ropaPurposeDrift: t('ropaPurposeDrift'),
    ropaDataMatch: t('ropaDataMatch'),
    ropaDataDrift: t('ropaDataDrift'),
    ropaRecipMatch: t('ropaRecipMatch'),
    ropaRecipDrift: t('ropaRecipDrift'),
    ropaNoLongerInRegister: t('ropaNoLongerInRegister'),
    fixWithRopaCta: t('fixWithRopaCta'),
  };
}

function buildToolbarMessages(t: Translator) {
  return {
    toolbarTargetDefault: t('toolbarTargetDefault'),
    toolbarBold: t('toolbarBold'),
    toolbarItalic: t('toolbarItalic'),
    toolbarUnderline: t('toolbarUnderline'),
    toolbarUnorderedList: t('toolbarUnorderedList'),
    toolbarOrderedList: t('toolbarOrderedList'),
    toolbarLink: t('toolbarLink'),
    toolbarClear: t('toolbarClear'),
    toolbarMoveUp: t('toolbarMoveUp'),
    toolbarMoveDown: t('toolbarMoveDown'),
    toolbarDelete: t('toolbarDelete'),
    addSectionRequiredGroup: t('addSectionRequiredGroup'),
    addSectionOptionalGroup: t('addSectionOptionalGroup'),
    addSectionCustomGroup: t('addSectionCustomGroup'),
    addSectionBlank: t('addSectionBlank'),
    addSectionBlankSub: t('addSectionBlankSub'),
    addSectionRequiredSub: t('addSectionRequiredSub'),
    addSectionAllPresent: t('addSectionAllPresent'),
  };
}

function buildShareMessages(t: Translator) {
  return {
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
  };
}

function buildLangAndPreviewMessages(t: Translator) {
  return {
    langModalStep: t('langModalStep'),
    langModalTitle: t('langModalTitle'),
    langModalSub: t('langModalSub'),
    langModalSearchPlaceholder: t('langModalSearchPlaceholder'),
    langModalAiNote: t('langModalAiNote'),
    aiLabel: t('aiLabel'),
    previewHeaderTitle: t('previewHeaderTitle'),
    previewReadIn: t('previewReadIn'),
    previewMachineTranslated: t('previewMachineTranslated'),
    previewEffective: t('previewEffective'),
    previewPublishedWith: t('previewPublishedWith'),
    printCta: t('printCta'),
    closeCta: t('closeCta'),
    brandDomain: t('brandDomain'),
  };
}

function buildToastMessages(t: Translator) {
  return {
    toastSaved: t('toastSaved'),
    toastPublished: t('toastPublished'),
    toastCopiedUrl: t('toastCopiedUrl'),
    toastCopiedEmbed: t('toastCopiedEmbed'),
    toastPdfOpening: t('toastPdfOpening'),
    toastSectionRemoved: t('toastSectionRemoved'),
    toastSectionAdded: t('toastSectionAdded'),
    toastFilledPlaceholders: t('toastFilledPlaceholders'),
    toastAlreadyPlain: t('toastAlreadyPlain'),
    toastSimplified: t('toastSimplified'),
    toastImproved: t('toastImproved'),
    toastAlreadyImproved: t('toastAlreadyImproved'),
    toastRewritten: t('toastRewritten'),
    toastTranslating: t('toastTranslating'),
    toastTranslationCreated: t('toastTranslationCreated'),
    toastRopaRealigned: t('toastRopaRealigned'),
    toastMinSections: t('toastMinSections'),
    toastSelectTextFirst: t('toastSelectTextFirst'),
    toastEnterLink: t('toastEnterLink'),
  };
}

function buildStatusMessages(t: Translator) {
  return {
    notFoundTitle: t('notFoundTitle'),
    notFoundDescription: t('notFoundDescription'),
    loadErrorTitle: t('loadErrorTitle'),
    loadErrorDescription: t('loadErrorDescription'),
    copyEmbedFailed: t('copyEmbedFailed'),
  };
}

export function buildNoticeEditorMessages(t: Translator): NoticeEditorMessages {
  return {
    ...buildHeaderMessages(t),
    ...buildSourceMessages(t),
    ...buildCheckMessages(t),
    ...buildAiMessages(t),
    ...buildToolbarMessages(t),
    ...buildShareMessages(t),
    ...buildLangAndPreviewMessages(t),
    ...buildToastMessages(t),
    ...buildStatusMessages(t),
  };
}
