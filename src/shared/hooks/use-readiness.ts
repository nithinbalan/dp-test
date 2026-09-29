/**
 * TanStack Query hooks for the Gap Assessment module (JDP-GAP). Talks to
 * `/api/readiness` — see docs/TANSTACK_QUERY.md. Replaces the old
 * `useGapAssessment()` sessionStorage store now that a real backend exists:
 * the run lives in the database, so it survives a refresh and is shared
 * across tabs/devices instead of being scoped to one browser session.
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';

export const readinessKeys = {
  all: ['readiness'] as const,
};

export type GateAnswer = 'yes' | 'no' | 'unsure';
export type AnswerValue = 'y' | 'n' | 'p' | 'u';

export type AssessmentProfile = {
  entity: string;
  assessorEmployeeId: string | null;
  sector: string;
  recordsHeld: string;
  kids: GateAnswer | null;
  proc: GateAnswer | null;
  xbt: GateAnswer | null;
  sens: GateAnswer | null;
};

export type ReadinessCatalogDomain = {
  id: string;
  key: string;
  name: string;
  sectionRefs: string[];
  gateKey: string | null;
};

export type ReadinessCatalogQuestion = {
  id: string;
  domainId: string;
  code: string;
  weight: number;
  sectionRef: string | null;
  prompt: string;
  module: string | null;
};

export type ScoreBandKey = 'ready' | 'substantial' | 'developing' | 'high-exposure';
export type ScoreBand = { key: ScoreBandKey; headline: string; body: string };

export type DomainResult = {
  key: string;
  name: string;
  sectionRefs: string[];
  isNotApplicable: boolean;
  percent: number | null;
  gapCount: number;
  questionCount: number;
};

export type GapSeverity = 'c' | 'h' | 'm' | 'l';

export type Gap = {
  questionId: string;
  code: string;
  domainKey: string;
  domainName: string;
  weight: number;
  sectionRef: string | null;
  question: string;
  fix: string;
  module: string | null;
  severity: GapSeverity;
  answer: AnswerValue;
  isUnsure: boolean;
};

export type AssessmentReport = {
  runId: string;
  refCode: string;
  score: number;
  band: ScoreBand;
  domains: DomainResult[];
  gaps: Gap[];
  criticalCount: number;
  unsureCount: number;
  questionsInScope: number;
  notApplicableCount: number;
  entity: string;
  completedAt: string;
};

export type ReadinessState =
  | { kind: 'empty' }
  | {
      kind: 'in-progress';
      runId: string;
      profile: AssessmentProfile;
      answers: Record<string, AnswerValue>;
      notes: Record<string, string>;
      questionsInScope: number;
      answeredCount: number;
    }
  | { kind: 'completed'; report: AssessmentReport };

export type ReadinessData = {
  domains: ReadinessCatalogDomain[];
  questions: ReadinessCatalogQuestion[];
  state: ReadinessState;
};

export function useReadiness() {
  return useQuery({
    queryKey: readinessKeys.all,
    queryFn: () => apiClient<ReadinessData>('/api/readiness'),
    staleTime: 30 * 1000,
  });
}

export function useStartAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient<ReadinessData>('/api/readiness', { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(readinessKeys.all, data);
    },
  });
}

export type UpdateRunInput =
  | { profile: AssessmentProfile }
  | { answer: { questionId: string; value: AnswerValue; note?: string | null | undefined } };

export function useUpdateRun(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRunInput) =>
      apiClient<ReadinessData>(`/api/readiness/${runId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(readinessKeys.all, data);
    },
  });
}

export function useFinishRun(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient<ReadinessData>(`/api/readiness/${runId}/finish`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.setQueryData(readinessKeys.all, data);
    },
  });
}
