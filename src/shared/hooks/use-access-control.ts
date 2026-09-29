/**
 * TanStack Query hooks for the Configuration Studio "Access control" panel.
 * Talks to `/api/settings/access-control` — see docs/TANSTACK_QUERY.md.
 *
 * The server resolves each role's stored, fine-grained `role_permission` rows
 * down to one `PermissionLevel` per module (see access-control-service.ts) —
 * this hook is a thin, typed wrapper around that already-shaped response, the
 * same shape `use-workspace-settings.ts` follows for the Workspace tab.
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';

export const accessControlKeys = {
  all: ['access-control'] as const,
  detail: () => [...accessControlKeys.all, 'detail'] as const,
};

export type PermissionLevel = 'none' | 'view' | 'edit' | 'approve';

export type AccessControlModule = {
  key: string;
  groupKey: string;
  name: string;
  icon: string;
};

export type AccessControlRole = {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  isLocked: boolean;
  permissions: Record<string, PermissionLevel>;
};

export type AccessControlData = {
  modules: AccessControlModule[];
  roles: AccessControlRole[];
};

export type AccessControlMutation =
  | { kind: 'createRole'; name: string; description?: string; startFromRoleId?: string }
  | { kind: 'duplicateRole'; roleId: string; name: string }
  | { kind: 'renameRole'; roleId: string; name: string }
  | { kind: 'setPermission'; roleId: string; moduleKey: string; level: PermissionLevel }
  | { kind: 'setAllPermissions'; roleId: string; level: PermissionLevel }
  | { kind: 'deleteRole'; roleId: string };

export function useAccessControl() {
  return useQuery({
    queryKey: accessControlKeys.detail(),
    queryFn: () => apiClient<AccessControlData>('/api/settings/access-control'),
    staleTime: 60 * 1000,
  });
}

/** One mutation hook for every Access control write — the route takes the same discriminated union. */
export function useAccessControlMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AccessControlMutation) =>
      apiClient<AccessControlData>('/api/settings/access-control', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(accessControlKeys.detail(), data);
    },
  });
}
