/**
 * Public API for @server/auth — what route handlers, server components, and other
 * modules may use. Crypto, rate limiting, and the notification provider are
 * internal to the auth flows and deliberately not exported here.
 */
export { SESSION_COOKIE_NAME, getSessionToken } from './cookies';
export { resolveWorkspaceContext } from './context-resolver';
export {
  signInWithPassword,
  validateSession,
  signOut,
  switchActiveWorkspace,
  toWorkspaceSummary,
} from './service';
export { requestPasswordReset, verifyResetCode, resetPassword } from './password-recovery';
export type * from './types';
