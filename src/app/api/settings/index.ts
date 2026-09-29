/**
 * Public barrel for the settings module.
 *
 * Exports the service only. The repository is deliberately absent: a caller that could
 * reach it would skip the validation and the DPO existence check that live in the
 * service. See docs/ARCHITECTURE.md "Adding a backend module".
 */
export {
  BASE_LANGUAGE_CODE,
  WORKSPACE_SECTORS,
  getWorkspaceSettings,
  saveWorkspaceSettings,
  type SaveWorkspaceSettingsError,
  type WorkspaceSector,
  type WorkspaceSettings,
  type WorkspaceSettingsInput,
} from './service';
export {
  createRole,
  duplicateRole,
  getAccessControl,
  renameRole,
  setAllPermissions,
  setRolePermission,
  type AccessControlData,
  type AccessControlModule,
  type AccessControlMutationError,
  type AccessControlRole,
  type CreateRoleInput,
  type PermissionLevel,
} from './access-control-service';
