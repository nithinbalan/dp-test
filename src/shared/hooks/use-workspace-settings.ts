/**
 * TanStack Query hooks for the Configuration Studio "Workspace" panel.
 * Talks to `/api/settings/workspace` — see docs/TANSTACK_QUERY.md.
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';

export const workspaceSettingsKeys = {
  all: ['workspace-settings'] as const,
  detail: () => [...workspaceSettingsKeys.all, 'detail'] as const,
};

/** One employee the DPO picker can assign — this workspace's live roster. */
export type WorkspaceDpoCandidate = {
  id: string;
  fullName: string;
  designation: string | null;
  workEmail: string | null;
};

export type WorkspaceSettingsData = {
  legalName: string;
  sector: string;
  languages: string[];
  dpoEmployeeId: string | null;
  publishDpoContact: boolean;
  logoUrl: string | null;
  dpoCandidates: WorkspaceDpoCandidate[];
};

export type SaveWorkspaceSettingsParams = {
  legalName: string;
  sector: string;
  languages: string[];
  dpoEmployeeId: string | null;
};

export function useWorkspaceSettings() {
  return useQuery({
    queryKey: workspaceSettingsKeys.detail(),
    queryFn: () => apiClient<WorkspaceSettingsData>('/api/settings/workspace'),
    staleTime: 60 * 1000,
  });
}

export function useSaveWorkspaceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveWorkspaceSettingsParams) =>
      apiClient<WorkspaceSettingsData>('/api/settings/workspace', {
        method: 'PATCH',
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(workspaceSettingsKeys.detail(), data);
    },
  });
}

/** Uploads a new workspace logo. Persists to the `attachment` table — see the route. */
export function useUploadWorkspaceLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.set('file', file);
      return apiClient<{ logoUrl: string }>('/api/settings/workspace/logo', {
        method: 'POST',
        body: form,
      });
    },
    onSuccess: ({ logoUrl }) => {
      queryClient.setQueryData<WorkspaceSettingsData | undefined>(
        workspaceSettingsKeys.detail(),
        (current) => (current ? { ...current, logoUrl } : current),
      );
    },
  });
}
