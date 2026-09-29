/**
 * TanStack Query hooks for the Notice Manager register.
 * Talks to `/api/notices` — see docs/TANSTACK_QUERY.md.
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';

export const noticesKeys = {
  all: ['notices'] as const,
  list: () => [...noticesKeys.all, 'list'] as const,
  detail: (id: string) => [...noticesKeys.all, 'detail', id] as const,
};

export type NoticeStatus = 'draft' | 'published';
export type NoticeSectionKey = string;

export type NoticeSection = {
  key: NoticeSectionKey;
  heading: string;
  body: string;
  alts?: string[];
  alt?: number;
};

export type NoticeCheckItem = {
  status: 'ok' | 'warn';
  messageKey: string;
  params?: Record<string, string | number>;
};

export type NoticeCheck = {
  isComplete: boolean;
  incompleteCount: number;
  items?: NoticeCheckItem[];
  hasPlaceholders?: boolean;
};

export type NoticeSourceMetadata = {
  ra: string;
  act: string;
  used: [string, string][];
};

export type NoticeSummary = {
  id: string;
  refCode: string;
  name: string;
  version: string;
  status: NoticeStatus;
  updatedAt: string;
  language: string;
  activityName: string | null;
  activityRef?: string | null;
  lang?: string;
  langs?: string[];
  docs?: Record<string, { name: string; secs: NoticeSection[] }>;
};

export type NoticeDetail = NoticeSummary & {
  sections: NoticeSection[];
  check: NoticeCheck;
  source?: NoticeSourceMetadata | null;
};

export type NoticesData = {
  notices: NoticeSummary[];
  publishedCount: number;
  draftCount: number;
};

export type CreateFromActivityParams = { name: string; activityId: string };
export type CreateFromScratchParams = { name: string; description: string };
export type SaveNoticeParams = {
  name: string;
  sections: NoticeSection[];
  lang?: string;
  langs?: string[];
  docs?: Record<string, { name: string; secs: NoticeSection[] }>;
};

export function useNotices() {
  return useQuery({
    queryKey: noticesKeys.list(),
    queryFn: () => apiClient<NoticesData>('/api/notices'),
    staleTime: 60 * 1000,
  });
}

export function useNotice(id: string) {
  return useQuery({
    queryKey: noticesKeys.detail(id),
    queryFn: () => apiClient<NoticeDetail>(`/api/notices/${id}`),
    staleTime: 60 * 1000,
  });
}

export function useCreateNoticeFromActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateFromActivityParams) =>
      apiClient<NoticeDetail>('/api/notices', {
        method: 'POST',
        body: JSON.stringify({ source: 'ropa', ...params }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noticesKeys.list() });
    },
  });
}

export function useCreateNoticeFromScratch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateFromScratchParams) =>
      apiClient<NoticeDetail>('/api/notices', {
        method: 'POST',
        body: JSON.stringify({ source: 'scratch', ...params }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noticesKeys.list() });
    },
  });
}

export function useSaveNotice(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveNoticeParams) =>
      apiClient<NoticeDetail>(`/api/notices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(params),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(noticesKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: noticesKeys.list() });
    },
  });
}

export function usePublishNotice(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient<NoticeDetail>(`/api/notices/${id}/publish`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(noticesKeys.detail(id), data);
      void queryClient.invalidateQueries({ queryKey: noticesKeys.list() });
    },
  });
}
