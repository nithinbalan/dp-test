/**
 * Shapes the auth services return to route handlers and server components.
 * Nothing here carries a hash, a token hash, or a schema name the client
 * should not see — `WorkspaceInfo.schemaName` is for server callers only.
 */
import type { WorkspaceRole } from '@server/workspace/context';
import type { SchemaName, UserId, WorkspaceId } from '@shared/types';

/** Public user profile information. */
export type UserProfile = {
  id: UserId;
  email: string;
  fullName: string;
  locale: string;
};

/** Active workspace context and schema information. */
export type WorkspaceInfo = {
  id: WorkspaceId;
  slug: string;
  legalName: string;
  logoUrl: string | null;
  schemaName: SchemaName;
  role: WorkspaceRole;
};

/** Summary descriptor for an authorized workspace. */
export type WorkspaceSummary = {
  id: WorkspaceId;
  slug: string;
  legalName: string;
  role: WorkspaceRole;
};

/** Credentials and context parameters for sign-in. */
export type SignInInput = {
  identifier: string;
  password: string;
  workspaceSlug?: string | undefined;
  ip?: string | undefined;
  userAgent?: string | undefined;
  rememberMe?: boolean | undefined;
};

/** Successful sign-in outcome with session token and workspace context. */
export type SignInSuccess = {
  rawToken: string;
  user: UserProfile;
  workspace: WorkspaceInfo;
  availableWorkspaces: WorkspaceSummary[];
};

/** Authenticated session validation outcome. */
export type SessionValidationSuccess = {
  sessionId: string;
  user: UserProfile;
  activeWorkspace: WorkspaceInfo;
  availableWorkspaces: WorkspaceSummary[];
};
