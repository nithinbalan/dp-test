import { getTranslator, type Translate } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { ActivityDetailView } from './ActivityDetailView';
import type { ActivityDetailMessages } from './ActivityDetailView.types';

type T = Translate<'ropa'>;

function buildRecordMessages(t: T) {
  return {
    fullRecordTitle: t('detailFullRecordTitle'),
    fullRecordSub: t('detailFullRecordSub'),
    rowActivity: t('detailRowActivity'),
    rowPurpose: t('detailRowPurpose'),
    rowSubjects: t('detailRowSubjects'),
    rowPersonalData: t('detailRowPersonalData'),
    rowSource: t('detailRowSource'),
    rowOperations: t('detailRowOperations'),
    rowSystems: t('detailRowSystems'),
    rowStorage: t('detailRowStorage'),
    rowProcessors: t('detailRowProcessors'),
    rowRecipients: t('detailRowRecipients'),
    rowCrossBorder: t('detailRowCrossBorder'),
    rowLawfulBasis: t('detailRowLawfulBasis'),
    rowRetention: t('detailRowRetention'),
    rowSecurity: t('detailRowSecurity'),
    rowOwner: t('detailRowOwner'),
    none: t('detailNone'),
    noneRecorded: t('detailNoneRecorded'),
    unknown: t('detailUnknown'),
    resolveCta: t('detailResolveCta'),
    resolveToast: t('detailResolveToast'),
    whyTitle: t('detailWhyTitle'),
    whySignals: t('detailWhySignals'),
    whyInference: t('detailWhyInference'),
    whyConfidence: t('detailWhyConfidence'),
  };
}

function buildSidePanelMessages(t: T) {
  return {
    evidenceTitle: t('detailEvidenceTitle'),
    evidenceSub: t('detailEvidenceSub'),
    evidenceEmpty: t('detailEvidenceEmpty'),
    approvalTitle: t('detailApprovalTitle'),
    approvalSub: t('detailApprovalSub'),
    approvalStatusLabel: t('tableStatus'),
    approvalReviewer: t('detailApprovalReviewer'),
    approvalReviewerPending: t('detailApprovalReviewerPending'),
    approvalDate: t('detailApprovalDate'),
    approvalVersion: t('detailApprovalVersion'),
    approvalSnapshot: t('detailApprovalSnapshot'),
    approvalSnapshotValue: t('detailApprovalSnapshotValue'),
    historyTitle: t('detailHistoryTitle'),
    historyEmpty: t('detailHistoryEmpty'),
    monitoringTitle: t('detailMonitoringTitle'),
    monitoringWatching: t('detailMonitoringWatching'),
    monitoringWatchingValue: t('detailMonitoringWatchingValue'),
    monitoringOnChange: t('detailMonitoringOnChange'),
    monitoringOnChangeValue: t('detailMonitoringOnChangeValue'),
  };
}

function buildHeaderMessages(t: T) {
  return {
    backCta: t('detailBackCta'),
    refLabel: t('detailRefLabel'),
    loadErrorTitle: t('detailLoadErrorTitle'),
    loadErrorDescription: t('detailLoadErrorDescription'),
    ownerPrefix: t('detailOwnerPrefix'),
    statusApproved: t('statusApproved'),
    statusNeedsReview: t('statusNeedsReview'),
    statusAiDraft: t('statusAiDraft'),
    actionApprove: t('actionApprove'),
    actionEdit: t('actionEdit'),
    toastApproved: t('toastApproved'),
    chipConfidence: t('detailChipConfidence'),
    chipSourceManual: t('detailChipSourceManual'),
    chipSourceLabel: t('detailChipSourceLabel'),
    chipEvidenceSources: t('detailChipEvidenceSources'),
    chipLastReviewed: t('detailChipLastReviewed'),
    chipProcessors: t('detailChipProcessors'),
    historyApprovedTemplate: t('detailHistoryApprovedTemplate'),
    justNowLabel: t('detailJustNowLabel'),
  };
}

function buildMessages(t: T): ActivityDetailMessages {
  return {
    ...buildHeaderMessages(t),
    ...buildRecordMessages(t),
    ...buildSidePanelMessages(t),
  };
}

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'ropa');

  return <ActivityDetailView id={id} t={buildMessages(t)} />;
}
