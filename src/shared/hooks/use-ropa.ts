/**
 * TanStack Query hooks for the RoPA ("Record of Processing Activities") register.
 * Talks to `/api/ropa` — see docs/TANSTACK_QUERY.md.
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';

export const ropaKeys = {
  all: ['ropa'] as const,
  list: () => [...ropaKeys.all, 'list'] as const,
  detail: (id: string) => [...ropaKeys.all, 'detail', id] as const,
};

export type ActivityStatus = 'approved' | 'needs-review' | 'ai-draft';

export type ActivitySummary = {
  id: string;
  refCode: string;
  name: string;
  principalType: string;
  principals: string;
  dataCategories: string[];
  basisLabel: string;
  retention: string;
  ownerName: string;
  ownerInitials: string;
  status: ActivityStatus;
  evidence: string[];
  confidence: number | undefined;
  issues: string[];
};

export type ActivityHistoryEntry = { label: string; date: string };

export type ActivityDetail = ActivitySummary & {
  purpose: string;
  lawfulBasis: string;
  retentionUnknown: boolean;
  dataSource: string;
  operations: string[];
  systems: string[];
  storageLocation: string;
  processors: string[];
  recipients: string[];
  crossBorder: string;
  security: string[];
  ownerId: string;
  reviewer: string | undefined;
  reviewedAt: string | undefined;
  version: number;
  history: ActivityHistoryEntry[];
  aiRationale: string | undefined;
};

export type ActivityWizardInput = {
  name: string;
  purpose: string;
  principals: string;
  identifiers: string[];
  collectionSource: string;
  storageLocations: string[];
  retention: string;
  lawfulBasis: string;
  processors: string[];
  ownerId: string | undefined;
  crossBorder: 'india' | 's16';
  operations: string[];
  securityMeasures: string[];
};

export function useActivities() {
  return useQuery({
    queryKey: ropaKeys.list(),
    queryFn: () => apiClient<ActivitySummary[]>('/api/ropa'),
    staleTime: 60 * 1000,
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: ropaKeys.detail(id),
    queryFn: () => apiClient<ActivityDetail>(`/api/ropa/${id}`),
    staleTime: 60 * 1000,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActivityWizardInput) =>
      apiClient<{ id: string; refCode: string }>('/api/ropa', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ropaKeys.list() });
    },
  });
}

export function useUpdateActivity(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActivityWizardInput) =>
      apiClient<{ id: string; refCode: string }>(`/api/ropa/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ropaKeys.list() });
      void queryClient.invalidateQueries({ queryKey: ropaKeys.detail(id) });
    },
  });
}

export function useApproveActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<{ id: string }>(`/api/ropa/${id}/approve`, { method: 'POST' }),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ropaKeys.list() });
      void queryClient.invalidateQueries({ queryKey: ropaKeys.detail(id) });
    },
  });
}
