'use client';

/**
 * TanStack Query hooks for Configuration Studio's "Master Data" panel — the
 * Gap Assessment questionnaire's sections and questions. Separate from
 * `use-readiness.ts` (the wizard/run hooks): this is admin authoring, not
 * taking the assessment, and invalidates the same `readinessKeys.all` query
 * so a newly added section/question shows up in the wizard immediately.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';
import { readinessKeys } from './use-readiness';

export const masterDataKeys = {
  domains: ['readiness-master-domains'] as const,
  questions: (domainId: string) => ['readiness-master-questions', domainId] as const,
};

export type MasterDomainRow = {
  id: string;
  name: string;
  questionCount: number;
  isActive: boolean;
};

export type MasterQuestionRow = {
  id: string;
  domainId: string;
  code: string;
  weight: number;
  sectionRef: string | null;
  prompt: string;
  remedy: string;
  position: number;
};

export type QuestionInput = {
  prompt: string;
  weight: number;
  sectionRef?: string | undefined;
  remedy?: string | undefined;
};

function invalidateMasterData(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: masterDataKeys.domains });
  void queryClient.invalidateQueries({ queryKey: readinessKeys.all });
}

export function useReadinessDomains() {
  return useQuery({
    queryKey: masterDataKeys.domains,
    queryFn: () => apiClient<MasterDomainRow[]>('/api/readiness/master-data/domains'),
    staleTime: 30 * 1000,
  });
}

export function useCreateReadinessDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiClient<MasterDomainRow>('/api/readiness/master-data/domains', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      invalidateMasterData(queryClient);
    },
  });
}

export function useUpdateReadinessDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, isActive }: { id: string; name: string; isActive: boolean }) =>
      apiClient<MasterDomainRow>(`/api/readiness/master-data/domains/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, isActive }),
      }),
    onSuccess: () => {
      invalidateMasterData(queryClient);
    },
  });
}

export function useDeleteReadinessDomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<true>(`/api/readiness/master-data/domains/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateMasterData(queryClient);
    },
  });
}

export function useReadinessQuestions(domainId: string) {
  return useQuery({
    queryKey: masterDataKeys.questions(domainId),
    queryFn: () =>
      apiClient<MasterQuestionRow[]>(`/api/readiness/master-data/domains/${domainId}/questions`),
    staleTime: 30 * 1000,
  });
}

export function useCreateReadinessQuestion(domainId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: QuestionInput) =>
      apiClient<MasterQuestionRow>(`/api/readiness/master-data/domains/${domainId}/questions`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: masterDataKeys.questions(domainId) });
      invalidateMasterData(queryClient);
    },
  });
}

export function useUpdateReadinessQuestion(domainId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: QuestionInput }) =>
      apiClient<MasterQuestionRow>(
        `/api/readiness/master-data/domains/${domainId}/questions/${id}`,
        { method: 'PATCH', body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: masterDataKeys.questions(domainId) });
      invalidateMasterData(queryClient);
    },
  });
}

export function useDeleteReadinessQuestion(domainId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient<true>(`/api/readiness/master-data/domains/${domainId}/questions/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: masterDataKeys.questions(domainId) });
      invalidateMasterData(queryClient);
    },
  });
}
