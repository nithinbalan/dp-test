/**
 * TanStack Query hooks for authentication, workspace switching, and password recovery.
 * See docs/TANSTACK_QUERY.md.
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';
import type { WorkspaceRole } from '@server/workspace/context';
import type { UserId, WorkspaceId } from '@shared/types';

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

export type AuthUser = {
  id: UserId;
  email: string;
  fullName: string;
  locale: string;
};

export type AuthWorkspace = {
  id: WorkspaceId;
  slug: string;
  legalName: string;
  role: WorkspaceRole;
};

export type SessionData = {
  user: AuthUser;
  workspace: AuthWorkspace;
  availableWorkspaces: AuthWorkspace[];
};

export type SignInParams = {
  identifier: string;
  password: string;
  workspaceSlug?: string | undefined;
  rememberMe?: boolean | undefined;
};

export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: () => apiClient<SessionData>('/api/auth/session'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SignInParams) =>
      apiClient<SessionData>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.session(), data);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient<{ success: boolean }>('/api/auth/logout', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.setQueryData(authKeys.session(), null);
      void queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

/**
 * Sets the workspace the session falls back to when the host names none. Under
 * subdomain resolution the host decides, so after a successful switch navigate to
 * `<slug>.<base domain>` — the returned `workspace.slug` is what to build that from.
 */
export function useSwitchWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: WorkspaceId) =>
      apiClient<{ workspace: AuthWorkspace }>('/api/auth/workspace/switch', {
        method: 'POST',
        body: JSON.stringify({ workspaceId }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useRequestResetCode() {
  return useMutation({
    mutationFn: (params: { identifier: string; channel: 'email' | 'whatsapp' }) =>
      apiClient<{ success: boolean }>('/api/auth/forgot-password/request', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
}

export function useVerifyResetCode() {
  return useMutation({
    mutationFn: (params: { identifier: string; code: string }) =>
      apiClient<{ resetToken: string }>('/api/auth/forgot-password/verify', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (params: { resetToken: string; newPassword: string }) =>
      apiClient<{ success: boolean }>('/api/auth/forgot-password/reset', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  });
}
