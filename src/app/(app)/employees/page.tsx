import { getTranslator, type Translate } from '@shared/lib';
import { getRequestLocale } from '@shared/lib/request-locale';
import { EmployeesList } from './EmployeesList';
import type { EmployeesMessages } from './EmployeesMessages';

function buildMessages(t: Translate<'employees'>): EmployeesMessages {
  return {
    kpiEmployees: t('kpiEmployees'),
    kpiWithAgent: t('kpiWithAgent'),
    kpiAvgAwareness: t('kpiAvgAwareness'),
    kpiOverdue: t('kpiOverdue'),
    searchPlaceholder: t('searchPlaceholder'),
    importCta: t('importCta'),
    remindCta: t('remindCta'),
    addEmployeeCta: t('addEmployeeCta'),
    tableCaption: t('tableCaption'),
    tableEmployee: t('tableEmployee'),
    tableEmail: t('tableEmail'),
    tableDepartment: t('tableDepartment'),
    tableAwareness: t('tableAwareness'),
    tableActions: t('tableActions'),
    remindLabel: t('remindLabel'),
    awarenessCertified: t('awarenessCertified'),
    awarenessInProgress: t('awarenessInProgress'),
    awarenessOverdue: t('awarenessOverdue'),
    toastReminderSent: t('toastReminderSent'),
    toastAllReminded: t('toastAllReminded'),
    loadErrorTitle: t('loadErrorTitle'),
    loadErrorDescription: t('loadErrorDescription'),
    emptyTitle: t('emptyTitle'),
    emptyDescription: t('emptyDescription'),
    noMatchTitle: t('noMatchTitle'),
    noMatchDescription: t('noMatchDescription'),
    clearSearchCta: t('clearSearchCta'),
    addEmployeeDialogTitle: t('addEmployeeDialogTitle'),
    addEmployeeDialogDescription: t('addEmployeeDialogDescription'),
    fieldFullName: t('fieldFullName'),
    fieldFullNamePlaceholder: t('fieldFullNamePlaceholder'),
    fieldEmployeeCode: t('fieldEmployeeCode'),
    fieldEmployeeCodeHint: t('fieldEmployeeCodeHint'),
    fieldEmployeeCodePlaceholder: t('fieldEmployeeCodePlaceholder'),
    fieldWorkEmail: t('fieldWorkEmail'),
    fieldWorkEmailPlaceholder: t('fieldWorkEmailPlaceholder'),
    fieldDepartment: t('fieldDepartment'),
    fieldDepartmentPlaceholder: t('fieldDepartmentPlaceholder'),
    fieldDepartmentEmptyHint: t('fieldDepartmentEmptyHint'),
    fieldDesignation: t('fieldDesignation'),
    fieldDesignationPlaceholder: t('fieldDesignationPlaceholder'),
    cancelCta: t('cancelCta'),
    createEmployeeCta: t('createEmployeeCta'),
    toastEmployeeCreated: t('toastEmployeeCreated'),
    errorNameRequired: t('errorNameRequired'),
    errorEmailConflict: t('errorEmailConflict'),
    errorGeneric: t('errorGeneric'),
    footerAgentNote: t('footerAgentNote'),
    footerRefNote: t('footerRefNote'),
    importDialogTitle: t('importDialogTitle'),
    importDialogDescription: t('importDialogDescription'),
    importFileFieldLabel: t('importFileFieldLabel'),
    importFileFieldHint: t('importFileFieldHint'),
    importDownloadTemplateCta: t('importDownloadTemplateCta'),
    importSubmitCta: t('importSubmitCta'),
    importDoneCta: t('importDoneCta'),
    importAnotherCta: t('importAnotherCta'),
    importNoFileError: t('importNoFileError'),
    importErrorGeneric: t('importErrorGeneric'),
    importSummaryInserted: t('importSummaryInserted'),
    importSummarySkippedTitle: t('importSummarySkippedTitle'),
    importReasonValidation: t('importReasonValidation'),
    importReasonDuplicate: t('importReasonDuplicate'),
    importDropHint: t('importDropHint'),
    importDropActiveHint: t('importDropActiveHint'),
    importRemoveFileLabel: t('importRemoveFileLabel'),
    importInvalidFileTypeError: t('importInvalidFileTypeError'),
    importFileTooLargeError: t('importFileTooLargeError'),
    importUploadingLabel: t('importUploadingLabel'),
    paginationSummary: t('paginationSummary'),
    pageSizeLabel: t('pageSizeLabel'),
  };
}

/**
 * Server component resolves locale/copy only (ADR-0006) — the roster itself is
 * fetched client-side by `EmployeesList` via `useEmployees()`, the same
 * TanStack Query pattern the Access control panel uses.
 */
export default async function EmployeesPage() {
  const locale = await getRequestLocale();
  const t = getTranslator(locale, 'employees');

  return (
    <EmployeesList
      pageLabel={t('label')}
      pageRefTag={t('refTag')}
      pageDescription={t('description')}
      t={buildMessages(t)}
    />
  );
}
