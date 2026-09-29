import type { Translate } from '@shared/lib';

/** Page-local — copy for Configuration Studio, resolved server-side in page.tsx. */
export type SettingsMessages = {
  tabWorkspace: string;
  tabNotifications: string;
  tabAssessment: string;
  tabAwareness: string;
  saveCta: string;
  toastSaved: string;
  lockedNote: string;
  groupGeneral: string;
  groupOverview: string;
  groupDataDiscovery: string;
  groupDataFoundation: string;
  groupPrivacyOperations: string;
  groupGovernance: string;
  groupPeopleAwareness: string;
  groupAdministration: string;
  groupMaster: string;
  navAccess: string;
  navGap: string;
  navSources: string;
  navDatamap: string;
  navEndpoints: string;
  navRopa: string;
  navNotices: string;
  navConsent: string;
  navDsr: string;
  navBreach: string;
  navTransfers: string;
  navThirdparty: string;
  navControls: string;
  navDpia: string;
  navRisks: string;
  navActions: string;
  navPeople: string;
  navDepartment: string;
  navQuestionnaire: string;
  comingSoonTitle: string;
  comingSoonDescription: string;
  accessTitle: string;
  accessDescription: string;
  roleTypeLabel: string;
  customRoleTypeLabel: string;
  rolePickerSearchPlaceholder: string;
  rolePickerFooterLabel: string;
  rolePickerNoResults: string;
  newRoleCta: string;
  newRoleName: string;
  newRoleDescription: string;
  newRoleNameFieldLabel: string;
  newRoleNamePlaceholder: string;
  startFromLabel: string;
  cancelCta: string;
  createRoleCta: string;
  toastRoleNameRequired: string;
  duplicateRoleLabel: string;
  toastRoleDuplicated: string;
  deleteRoleLabel: string;
  toastRoleDeleted: string;
  toastRoleCreated: string;
  toastRoleRenamed: string;
  toastPermissionUpdated: string;
  accessLoadErrorTitle: string;
  accessLoadErrorDescription: string;
  setAllLabel: string;
  levelNone: string;
  levelView: string;
  levelEdit: string;
  levelApprove: string;
  levelHierarchyHint: string;
  accessFooterNote: string;
  moduleDashboard: string;
  moduleCollection: string;
  moduleDpia: string;
  moduleIssues: string;
  moduleEmployees: string;
  moduleAcademy: string;
  moduleSettings: string;
  roleAdminName: string;
  roleAdminDescription: string;
  roleDpoName: string;
  roleDpoDescription: string;
  roleComplianceName: string;
  roleComplianceDescription: string;
  roleDsrOfficerName: string;
  roleDsrOfficerDescription: string;
  roleLegalName: string;
  roleLegalDescription: string;
  roleAuditorName: string;
  roleAuditorDescription: string;
  roleEmployeeName: string;
  roleEmployeeDescription: string;
  roleViewerName: string;
  roleViewerDescription: string;
  workspaceTitle: string;
  workspaceDescription: string;
  saveWorkspaceCta: string;
  footerHint: string;
  lockedBadge: string;
  workspaceLogoLabel: string;
  workspaceLogoDescription: string;
  workspaceLogoUpload: string;
  workspaceLogoReplace: string;
  legalNameLabel: string;
  legalNameDescription: string;
  tenantLabel: string;
  tenantDescription: string;
  sectorLabel: string;
  sectorDescription: string;
  sectorSaas: string;
  sectorEcommerce: string;
  sectorHealthcare: string;
  sectorEdtech: string;
  sectorBfsi: string;
  sectorManufacturing: string;
  sectorProfessional: string;
  languagesLabel: string;
  languagesDescription: string;
  languageEnglish: string;
  languageHindi: string;
  languageHindiNative: string;
  languageMalayalam: string;
  languageMalayalamNative: string;
  languageTamil: string;
  languageTamilNative: string;
  languageBengali: string;
  languageBengaliNative: string;
  languageMarathi: string;
  languageMarathiNative: string;
  languageTelugu: string;
  languageTeluguNative: string;
  languageGujarati: string;
  languageGujaratiNative: string;
  languageKannada: string;
  languageKannadaNative: string;
  dpoLabel: string;
  dpoDescription: string;
  dpoSearchPlaceholder: string;
  dpoEscHint: string;
  dpoFooterLabel: string;
  dpoManageLabel: string;
  publishDpoLabel: string;
  publishDpoDescription: string;
  notificationsTitle: string;
  notificationsDescription: string;
  digestLabel: string;
  digestDaily: string;
  digestWeekly: string;
  digestOff: string;
  emailLabel: string;
  emailDescription: string;
  whatsappLabel: string;
  whatsappDescription: string;
  escalateLabel: string;
  escalateDescription: string;
  assessmentTitle: string;
  assessmentDescription: string;
  cadenceLabel: string;
  cadenceMonthly: string;
  cadenceQuarterly: string;
  cadenceHalfYearly: string;
  assessorLabel: string;
  pushGapsLabel: string;
  pushGapsDescription: string;
  childrenDpiaLabel: string;
  childrenDpiaDescription: string;
  dpoSignOffLabel: string;
  dpoSignOffDescription: string;
  boardWindowLabel: string;
  boardWindowDescription: string;
  boardWindowValue: string;
  awarenessTitle: string;
  awarenessDescription: string;
  autoEnrolLabel: string;
  autoEnrolDescription: string;
  reminderCadenceLabel: string;
  reminderWeekly: string;
  reminderFortnightly: string;
  recertLabel: string;
  recertDescription: string;
  masterTitle: string;
  masterDescription: string;
  tabDepartments: string;
  tabSections: string;
  departmentTitle: string;
  departmentDescription: string;
  departmentNameLabel: string;
  departmentNameDescription: string;
  departmentNamePlaceholder: string;
  addDepartmentCta: string;
  departmentNameRequired: string;
  departmentNameConflict: string;
  toastDepartmentCreated: string;
  toastDepartmentUpdated: string;
  toastDepartmentDeleted: string;
  departmentDeleteConflict: string;
  departmentEmptyTitle: string;
  departmentEmptyDescription: string;
  departmentLoadError: string;
  deleteDepartmentLabel: string;
  sectionsTitle: string;
  sectionsDescription: string;
  sectionNameLabel: string;
  sectionNameDescription: string;
  sectionNamePlaceholder: string;
  addSectionCta: string;
  sectionNameRequired: string;
  toastSectionCreated: string;
  toastSectionUpdated: string;
  toastSectionDeleted: string;
  sectionDeleteConflict: string;
  sectionEmptyTitle: string;
  sectionEmptyDescription: string;
  deleteSectionLabel: string;
  sectionQuestionCount: string;
  manageQuestionsCta: string;
  questionsEmptyDescription: string;
  questionPromptLabel: string;
  questionPromptPlaceholder: string;
  questionWeightLabel: string;
  questionWeightLow: string;
  questionWeightMedium: string;
  questionWeightMustHave: string;
  questionSectionRefLabel: string;
  questionSectionRefPlaceholder: string;
  questionRemedyLabel: string;
  questionRemedyPlaceholder: string;
  addQuestionCta: string;
  questionPromptRequired: string;
  toastQuestionCreated: string;
  toastQuestionUpdated: string;
  toastQuestionDeleted: string;
  questionDeleteConflict: string;
  deleteQuestionLabel: string;
  errorGeneric: string;
  statusActive: string;
  statusInactive: string;
  badgeAdded: string;
  badgeEdited: string;
  badgeDeleted: string;
  headerDepartmentName: string;
  headerSectionName: string;
  headerStatus: string;
  headerActions: string;
  addCta: string;
  discardCta: string;
  pendingChangesTitle: string;
};

type T = Translate<'settings'>;

function resolveNavMessages(t: T) {
  return {
    tabWorkspace: t('tabWorkspace'),
    tabNotifications: t('tabNotifications'),
    tabAssessment: t('tabAssessment'),
    tabAwareness: t('tabAwareness'),
    groupGeneral: t('groupGeneral'),
    groupOverview: t('groupOverview'),
    groupDataDiscovery: t('groupDataDiscovery'),
    groupDataFoundation: t('groupDataFoundation'),
    groupPrivacyOperations: t('groupPrivacyOperations'),
    groupGovernance: t('groupGovernance'),
    groupPeopleAwareness: t('groupPeopleAwareness'),
    groupAdministration: t('groupAdministration'),
    groupMaster: t('groupMaster'),
    navAccess: t('navAccess'),
    navGap: t('navGap'),
    navSources: t('navSources'),
    navDatamap: t('navDatamap'),
    navEndpoints: t('navEndpoints'),
    navRopa: t('navRopa'),
    navNotices: t('navNotices'),
    navConsent: t('navConsent'),
    navDsr: t('navDsr'),
    navBreach: t('navBreach'),
    navTransfers: t('navTransfers'),
    navThirdparty: t('navThirdparty'),
    navControls: t('navControls'),
    navDpia: t('navDpia'),
    navRisks: t('navRisks'),
    navActions: t('navActions'),
    navPeople: t('navPeople'),
    navDepartment: t('navDepartment'),
    navQuestionnaire: t('navQuestionnaire'),
    comingSoonTitle: t('comingSoonTitle'),
    comingSoonDescription: t('comingSoonDescription'),
  };
}

function resolveAccessMessages(t: T) {
  return {
    accessTitle: t('accessTitle'),
    accessDescription: t('accessDescription'),
    roleTypeLabel: t('roleTypeLabel'),
    customRoleTypeLabel: t('customRoleTypeLabel'),
    rolePickerSearchPlaceholder: t('rolePickerSearchPlaceholder'),
    rolePickerFooterLabel: t('rolePickerFooterLabel'),
    rolePickerNoResults: t('rolePickerNoResults'),
    newRoleCta: t('newRoleCta'),
    newRoleName: t('newRoleName'),
    newRoleDescription: t('newRoleDescription'),
    newRoleNameFieldLabel: t('newRoleNameFieldLabel'),
    newRoleNamePlaceholder: t('newRoleNamePlaceholder'),
    startFromLabel: t('startFromLabel'),
    cancelCta: t('cancelCta'),
    createRoleCta: t('createRoleCta'),
    toastRoleNameRequired: t('toastRoleNameRequired'),
    duplicateRoleLabel: t('duplicateRoleLabel'),
    toastRoleDuplicated: t('toastRoleDuplicated'),
    deleteRoleLabel: t('deleteRoleLabel'),
    toastRoleDeleted: t('toastRoleDeleted'),
    toastRoleCreated: t('toastRoleCreated'),
    toastRoleRenamed: t('toastRoleRenamed'),
    toastPermissionUpdated: t('toastPermissionUpdated'),
    accessLoadErrorTitle: t('accessLoadErrorTitle'),
    accessLoadErrorDescription: t('accessLoadErrorDescription'),
    setAllLabel: t('setAllLabel'),
    levelNone: t('levelNone'),
    levelView: t('levelView'),
    levelEdit: t('levelEdit'),
    levelApprove: t('levelApprove'),
    levelHierarchyHint: t('levelHierarchyHint'),
    accessFooterNote: t('accessFooterNote'),
    moduleDashboard: t('moduleDashboard'),
    moduleCollection: t('moduleCollection'),
    moduleDpia: t('moduleDpia'),
    moduleIssues: t('moduleIssues'),
    moduleEmployees: t('moduleEmployees'),
    moduleAcademy: t('moduleAcademy'),
    moduleSettings: t('moduleSettings'),
  };
}

function resolveRoleMessages(t: T) {
  return {
    roleAdminName: t('roleAdminName'),
    roleAdminDescription: t('roleAdminDescription'),
    roleDpoName: t('roleDpoName'),
    roleDpoDescription: t('roleDpoDescription'),
    roleComplianceName: t('roleComplianceName'),
    roleComplianceDescription: t('roleComplianceDescription'),
    roleDsrOfficerName: t('roleDsrOfficerName'),
    roleDsrOfficerDescription: t('roleDsrOfficerDescription'),
    roleLegalName: t('roleLegalName'),
    roleLegalDescription: t('roleLegalDescription'),
    roleAuditorName: t('roleAuditorName'),
    roleAuditorDescription: t('roleAuditorDescription'),
    roleEmployeeName: t('roleEmployeeName'),
    roleEmployeeDescription: t('roleEmployeeDescription'),
    roleViewerName: t('roleViewerName'),
    roleViewerDescription: t('roleViewerDescription'),
  };
}

function resolveWorkspaceMessages(t: T) {
  return {
    workspaceTitle: t('workspaceTitle'),
    workspaceDescription: t('workspaceDescription'),
    saveWorkspaceCta: t('saveWorkspaceCta'),
    footerHint: t('footerHint'),
    lockedBadge: t('lockedBadge'),
    workspaceLogoLabel: t('workspaceLogoLabel'),
    workspaceLogoDescription: t('workspaceLogoDescription'),
    workspaceLogoUpload: t('workspaceLogoUpload'),
    workspaceLogoReplace: t('workspaceLogoReplace'),
    legalNameLabel: t('legalNameLabel'),
    legalNameDescription: t('legalNameDescription'),
    tenantLabel: t('tenantLabel'),
    tenantDescription: t('tenantDescription'),
    sectorLabel: t('sectorLabel'),
    sectorDescription: t('sectorDescription'),
    sectorSaas: t('sectorSaas'),
    sectorEcommerce: t('sectorEcommerce'),
    sectorHealthcare: t('sectorHealthcare'),
    sectorEdtech: t('sectorEdtech'),
    sectorBfsi: t('sectorBfsi'),
    sectorManufacturing: t('sectorManufacturing'),
    sectorProfessional: t('sectorProfessional'),
    languagesLabel: t('languagesLabel'),
    languagesDescription: t('languagesDescription'),
    languageEnglish: t('languageEnglish'),
    languageHindi: t('languageHindi'),
    languageHindiNative: t('languageHindiNative'),
    languageMalayalam: t('languageMalayalam'),
    languageMalayalamNative: t('languageMalayalamNative'),
    languageTamil: t('languageTamil'),
    languageTamilNative: t('languageTamilNative'),
    languageBengali: t('languageBengali'),
    languageBengaliNative: t('languageBengaliNative'),
    languageMarathi: t('languageMarathi'),
    languageMarathiNative: t('languageMarathiNative'),
    languageTelugu: t('languageTelugu'),
    languageTeluguNative: t('languageTeluguNative'),
    languageGujarati: t('languageGujarati'),
    languageGujaratiNative: t('languageGujaratiNative'),
    languageKannada: t('languageKannada'),
    languageKannadaNative: t('languageKannadaNative'),
    dpoLabel: t('dpoLabel'),
    dpoDescription: t('dpoDescription'),
    dpoSearchPlaceholder: t('dpoSearchPlaceholder'),
    dpoEscHint: t('dpoEscHint'),
    dpoFooterLabel: t('dpoFooterLabel'),
    dpoManageLabel: t('dpoManageLabel'),
    publishDpoLabel: t('publishDpoLabel'),
    publishDpoDescription: t('publishDpoDescription'),
  };
}

function resolveNotificationsMessages(t: T) {
  return {
    notificationsTitle: t('notificationsTitle'),
    notificationsDescription: t('notificationsDescription'),
    digestLabel: t('digestLabel'),
    digestDaily: t('digestDaily'),
    digestWeekly: t('digestWeekly'),
    digestOff: t('digestOff'),
    emailLabel: t('emailLabel'),
    emailDescription: t('emailDescription'),
    whatsappLabel: t('whatsappLabel'),
    whatsappDescription: t('whatsappDescription'),
    escalateLabel: t('escalateLabel'),
    escalateDescription: t('escalateDescription'),
  };
}

function resolveAssessmentMessages(t: T) {
  return {
    assessmentTitle: t('assessmentTitle'),
    assessmentDescription: t('assessmentDescription'),
    cadenceLabel: t('cadenceLabel'),
    cadenceMonthly: t('cadenceMonthly'),
    cadenceQuarterly: t('cadenceQuarterly'),
    cadenceHalfYearly: t('cadenceHalfYearly'),
    assessorLabel: t('assessorLabel'),
    pushGapsLabel: t('pushGapsLabel'),
    pushGapsDescription: t('pushGapsDescription'),
    childrenDpiaLabel: t('childrenDpiaLabel'),
    childrenDpiaDescription: t('childrenDpiaDescription'),
    dpoSignOffLabel: t('dpoSignOffLabel'),
    dpoSignOffDescription: t('dpoSignOffDescription'),
    boardWindowLabel: t('boardWindowLabel'),
    boardWindowDescription: t('boardWindowDescription'),
    boardWindowValue: t('boardWindowValue'),
  };
}

function resolveAwarenessMessages(t: T) {
  return {
    awarenessTitle: t('awarenessTitle'),
    awarenessDescription: t('awarenessDescription'),
    autoEnrolLabel: t('autoEnrolLabel'),
    autoEnrolDescription: t('autoEnrolDescription'),
    reminderCadenceLabel: t('reminderCadenceLabel'),
    reminderWeekly: t('reminderWeekly'),
    reminderFortnightly: t('reminderFortnightly'),
    recertLabel: t('recertLabel'),
    recertDescription: t('recertDescription'),
  };
}

function resolveDepartmentMessages(t: T) {
  return {
    departmentTitle: t('departmentTitle'),
    departmentDescription: t('departmentDescription'),
    departmentNameLabel: t('departmentNameLabel'),
    departmentNameDescription: t('departmentNameDescription'),
    departmentNamePlaceholder: t('departmentNamePlaceholder'),
    addDepartmentCta: t('addDepartmentCta'),
    departmentNameRequired: t('departmentNameRequired'),
    departmentNameConflict: t('departmentNameConflict'),
    toastDepartmentCreated: t('toastDepartmentCreated'),
    toastDepartmentUpdated: t('toastDepartmentUpdated'),
    toastDepartmentDeleted: t('toastDepartmentDeleted'),
    departmentDeleteConflict: t('departmentDeleteConflict'),
    departmentEmptyTitle: t('departmentEmptyTitle'),
    departmentEmptyDescription: t('departmentEmptyDescription'),
    departmentLoadError: t('departmentLoadError'),
    deleteDepartmentLabel: t('deleteDepartmentLabel'),
    errorGeneric: t('errorGeneric'),
  };
}

function resolveMasterDataMessages(t: T) {
  return {
    masterTitle: t('masterTitle'),
    masterDescription: t('masterDescription'),
    tabDepartments: t('tabDepartments'),
    tabSections: t('tabSections'),
    sectionsTitle: t('sectionsTitle'),
    sectionsDescription: t('sectionsDescription'),
    sectionNameLabel: t('sectionNameLabel'),
    sectionNameDescription: t('sectionNameDescription'),
    sectionNamePlaceholder: t('sectionNamePlaceholder'),
    addSectionCta: t('addSectionCta'),
    sectionNameRequired: t('sectionNameRequired'),
    toastSectionCreated: t('toastSectionCreated'),
    toastSectionUpdated: t('toastSectionUpdated'),
    toastSectionDeleted: t('toastSectionDeleted'),
    sectionDeleteConflict: t('sectionDeleteConflict'),
    sectionEmptyTitle: t('sectionEmptyTitle'),
    sectionEmptyDescription: t('sectionEmptyDescription'),
    deleteSectionLabel: t('deleteSectionLabel'),
    sectionQuestionCount: t('sectionQuestionCount'),
    manageQuestionsCta: t('manageQuestionsCta'),
    questionsEmptyDescription: t('questionsEmptyDescription'),
    questionPromptLabel: t('questionPromptLabel'),
    questionPromptPlaceholder: t('questionPromptPlaceholder'),
    questionWeightLabel: t('questionWeightLabel'),
    questionWeightLow: t('questionWeightLow'),
    questionWeightMedium: t('questionWeightMedium'),
    questionWeightMustHave: t('questionWeightMustHave'),
    questionSectionRefLabel: t('questionSectionRefLabel'),
    questionSectionRefPlaceholder: t('questionSectionRefPlaceholder'),
    questionRemedyLabel: t('questionRemedyLabel'),
    questionRemedyPlaceholder: t('questionRemedyPlaceholder'),
    addQuestionCta: t('addQuestionCta'),
    questionPromptRequired: t('questionPromptRequired'),
    toastQuestionCreated: t('toastQuestionCreated'),
    toastQuestionUpdated: t('toastQuestionUpdated'),
    toastQuestionDeleted: t('toastQuestionDeleted'),
    questionDeleteConflict: t('questionDeleteConflict'),
    deleteQuestionLabel: t('deleteQuestionLabel'),
  };
}

export function resolveSettingsMessages(t: T): SettingsMessages {
  return {
    saveCta: t('saveCta'),
    toastSaved: t('toastSaved'),
    lockedNote: t('lockedNote'),
    statusActive: 'Active',
    statusInactive: 'Inactive',
    badgeAdded: 'Added',
    badgeEdited: 'Edited',
    badgeDeleted: 'Deleted',
    headerDepartmentName: 'Department Name',
    headerSectionName: 'Section Name',
    headerStatus: 'Status',
    headerActions: 'Actions',
    addCta: 'Add',
    discardCta: 'Discard',
    pendingChangesTitle: 'Pending Draft Changes',
    ...resolveNavMessages(t),
    ...resolveAccessMessages(t),
    ...resolveRoleMessages(t),
    ...resolveWorkspaceMessages(t),
    ...resolveNotificationsMessages(t),
    ...resolveAssessmentMessages(t),
    ...resolveAwarenessMessages(t),
    ...resolveDepartmentMessages(t),
    ...resolveMasterDataMessages(t),
  };
}
