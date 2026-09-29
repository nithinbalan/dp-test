/**
 * Local mock state for the Settings tabs that are not yet wired to the backend
 * (Notifications, Gap Assessment, Awareness). The Workspace tab is real,
 * DB-backed data now — see WorkspaceSettingsPanel.tsx and @shared/hooks's
 * useWorkspaceSettings.
 */
export type SettingsState = {
  digestFrequency: string;
  emailNotifications: boolean;
  whatsappNudges: boolean;
  escalateOverdue: boolean;
  reassessmentCadence: string;
  defaultAssessorId: string | undefined;
  pushGapsToIssues: boolean;
  childrenAlwaysDpia: boolean;
  dpoSignOffRequired: boolean;
  autoEnrolNewJoiners: boolean;
  awarenessReminderCadence: string;
  recertificationMonths: number;
};

export const INITIAL_SETTINGS: SettingsState = {
  digestFrequency: 'daily',
  emailNotifications: true,
  whatsappNudges: true,
  escalateOverdue: true,
  reassessmentCadence: 'quarterly',
  defaultAssessorId: 'person-1',
  pushGapsToIssues: true,
  childrenAlwaysDpia: true,
  dpoSignOffRequired: true,
  autoEnrolNewJoiners: true,
  awarenessReminderCadence: 'weekly',
  recertificationMonths: 12,
};
